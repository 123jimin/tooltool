import {assert} from "chai";

import {assertEqualType} from "../type/index.ts";
import {
    createExponentialBackoffDelay,
    type DelayFunctionWithForfeit,
    getDelayForExponentialBackoff,
    type RetryInfo,
    retryWithDelay,
} from "./retry.ts";

describe("function/retry", () => {
    describe("retryWithDelay", () => {
        it("should work as advertised", async () => {
            let calls = 0;
            const result = await retryWithDelay(async () => {
                if(++calls < 3) throw new Error("temporary failure");
                return "ready";
            }, createExponentialBackoffDelay({init_delay: 0, max_attempts: 3}));
            assert.strictEqual(result, "ready");
            assert.strictEqual(calls, 3);
        });

        it("should return an initial success without invoking the delay", async () => {
            const result = await retryWithDelay(async (info) => {
                assert.strictEqual(info.attempts, 0);
                assert.strictEqual(info.error, void 0);
                return 42;
            }, async () => { assert.fail("a successful attempt must not trigger a delay"); });
            assert.strictEqual(result, 42);
            assertEqualType<typeof result, number>();
        });

        it("should pass the latest failure and failure count to subsequent attempts", async () => {
            const errors = [new Error("first failure"), new Error("second failure")];
            const attempts: RetryInfo[] = [];
            const delays: RetryInfo[] = [];
            const result = await retryWithDelay(async (info) => {
                attempts.push({...info});
                if(info.attempts < errors.length) throw errors[info.attempts];
                return "done";
            }, async (info) => { delays.push({...info}); });
            assert.strictEqual(result, "done");
            assertEqualType<typeof result, string>();
            assert.deepStrictEqual(attempts, [
                {attempts: 0},
                {attempts: 1, error: errors[0]},
                {attempts: 2, error: errors[1]},
            ]);
            assert.deepStrictEqual(delays, attempts.slice(1));
        });

        it("should stop immediately when the delay forfeits", async () => {
            let calls = 0;
            const result = await retryWithDelay(async () => {
                ++calls;
                throw new Error("stop");
            }, async () => false);
            assert.strictEqual(result, null);
            assert.strictEqual(calls, 1);
        });

        it("should propagate delay errors without retrying them", async () => {
            const error = new Error("delay failed");
            let calls = 0;
            await retryWithDelay(async () => {
                ++calls;
                throw new Error("attempt failed");
            }, async () => { throw error; }).then(
                () => assert.fail("expected delay rejection"),
                (reason: unknown) => { assert.strictEqual(reason, error); },
            );
            assert.strictEqual(calls, 1);
        });
    });

    describe("createExponentialBackoffDelay", () => {
        it("should work as advertised", async () => {
            let calls = 0;
            const delay = createExponentialBackoffDelay({init_delay: 0, max_attempts: 5});
            const result = await retryWithDelay(async () => {
                ++calls;
                throw new Error("unavailable");
            }, delay);
            assert.strictEqual(result, null);
            assert.strictEqual(calls, 5);
        });

        it("should count the initial call toward the attempt limit and forfeit without sleeping", async () => {
            const timeout_descriptor = Object.getOwnPropertyDescriptor(globalThis, "setTimeout")!;
            let sleeps = 0;
            Object.defineProperty(globalThis, "setTimeout", {
                configurable: true,
                value: (callback: () => void) => {
                    ++sleeps;
                    queueMicrotask(callback);
                    return 0;
                },
            });
            try {
                let calls = 0;
                const result = await retryWithDelay(async () => {
                    ++calls;
                    throw new Error("only attempt");
                }, createExponentialBackoffDelay({init_delay: 10, max_attempts: 1}));
                assert.strictEqual(result, null);
                assert.strictEqual(calls, 1);
                assert.strictEqual(sleeps, 0);
            } finally {
                Object.defineProperty(globalThis, "setTimeout", timeout_descriptor);
            }
        });

        it("should keep retrying when max_attempts is nonpositive", async () => {
            for(const max_attempts of [0, -1]) {
                let calls = 0;
                const result = await retryWithDelay(async () => {
                    if(++calls < 3) throw new Error("retry");
                    return "recovered";
                }, createExponentialBackoffDelay({init_delay: 0, max_attempts}));
                assert.strictEqual(result, "recovered");
                assert.strictEqual(calls, 3);
            }
        });

        it("should propagate a nonfinite delay rejection without another attempt", async () => {
            let calls = 0;
            await retryWithDelay(async () => {
                if(++calls === 1) throw new Error("attempt failed");
                return "unexpected recovery";
            }, createExponentialBackoffDelay({init_delay: Infinity})).then(
                () => assert.fail("expected an invalid delay to reject"),
                (reason: unknown) => { assert.instanceOf(reason, RangeError); },
            );
            assert.strictEqual(calls, 1);
        });
    });

    describe("getDelayForExponentialBackoff", () => {
        it("should grow from the initial delay and remain capped at max_delay", () => {
            const options = {init_delay: 10, multiplier: 3, max_delay: 80};
            assert.deepStrictEqual([1, 2, 3, 4].map((attempts) => getDelayForExponentialBackoff(options, attempts)), [10, 30, 80, 80]);
            assert.strictEqual(getDelayForExponentialBackoff({init_delay: 100, max_delay: 20}, 1), 20);
            assert.strictEqual(getDelayForExponentialBackoff({init_delay: 10}, 4), 80);
        });
    });

    context("factory return types", () => {
        it("should infer a boolean-returning delay for an options variable with positive max_attempts", async () => {
            const options = {init_delay: 0, max_attempts: 2};
            const delay = createExponentialBackoffDelay(options);
            assertEqualType<typeof delay, DelayFunctionWithForfeit>();
            assert.strictEqual(await delay({attempts: 1}), true);
            assert.strictEqual(await delay({attempts: 2}), false);
        });

        it("should infer nullable retry results for positive options variables and literals", async () => {
            const options = {init_delay: 0, max_attempts: 1};
            const variable_result = retryWithDelay(async () => 42, createExponentialBackoffDelay(options));
            const literal_result = retryWithDelay(async () => 42, createExponentialBackoffDelay({init_delay: 0, max_attempts: 1}));
            assertEqualType<typeof variable_result, Promise<number|null>>();
            assertEqualType<typeof literal_result, Promise<number|null>>();
            assert.strictEqual(await variable_result, 42);
            assert.strictEqual(await literal_result, 42);
        });

        it("should infer boolean delays and nullable retry results for nonpositive and omitted limits", async () => {
            const zero_delay = createExponentialBackoffDelay({init_delay: 0, max_attempts: 0});
            const negative_options = {init_delay: 0, max_attempts: -1};
            const negative_delay = createExponentialBackoffDelay(negative_options);
            const omitted_delay = createExponentialBackoffDelay({init_delay: 0});
            assertEqualType<typeof zero_delay, DelayFunctionWithForfeit>();
            assertEqualType<typeof negative_delay, DelayFunctionWithForfeit>();
            assertEqualType<typeof omitted_delay, DelayFunctionWithForfeit>();
            const zero_result = retryWithDelay(async () => 42, zero_delay);
            const negative_result = retryWithDelay(async () => 42, negative_delay);
            const omitted_result = retryWithDelay(async () => 42, omitted_delay);
            assertEqualType<typeof zero_result, Promise<number|null>>();
            assertEqualType<typeof negative_result, Promise<number|null>>();
            assertEqualType<typeof omitted_result, Promise<number|null>>();
            assert.strictEqual(await zero_result, 42);
            assert.strictEqual(await negative_result, 42);
            assert.strictEqual(await omitted_result, 42);
            for(const delay of [zero_delay, negative_delay, omitted_delay]) {
                assert.strictEqual(await delay({attempts: 3}), true);
            }
        });
    });
});

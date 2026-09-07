import {assert} from "chai";

import {identity, invoke, nop, sleep} from "./basic.ts";

async function withTimerClock(run: (elapsed: () => number, delays: readonly number[]) => Promise<void>, lateness = 0): Promise<void> {
    const timeout_descriptor = Object.getOwnPropertyDescriptor(globalThis, "setTimeout")!;
    const now_descriptor = Object.getOwnPropertyDescriptor(performance, "now");
    let elapsed = 0;
    const delays: number[] = [];
    Object.defineProperty(performance, "now", {configurable: true, value: () => elapsed});
    Object.defineProperty(globalThis, "setTimeout", {
        configurable: true,
        value: (callback: () => void, duration: number) => {
            if(delays.length >= 64) throw new Error("Sleep scheduled unexpectedly many timers");
            delays.push(duration);
            // Model timer truncation and overflow without waiting in real time.
            const delay = duration > 2 ** 31 - 1 ? 1 : Math.max(1, Math.trunc(duration));
            queueMicrotask(() => {
                elapsed += delay + lateness;
                callback();
            });
            return 0;
        },
    });
    try {
        await run(() => elapsed, delays);
    } finally {
        Object.defineProperty(globalThis, "setTimeout", timeout_descriptor);
        if(now_descriptor == null) Reflect.deleteProperty(performance, "now");
        else Object.defineProperty(performance, "now", now_descriptor);
    }
}

describe("function/basic", () => {
    describe("sleep", () => {
        it("should work as advertised", async () => {
            await withTimerClock(async (elapsed) => {
                await sleep(500);
                assert.strictEqual(elapsed(), 500);
            });
        });

        it("should choose waits at the short and medium duration boundaries", async () => {
            const cases: Array<[number, number[]]> = [
                [1000, [1000]],
                [1001, [501, 500]],
                [10000, [9500, 500]],
                [10001, [7500.75, 2001, 500]],
            ];
            for(const [duration, expected_delays] of cases) {
                await withTimerClock(async (elapsed, delays) => {
                    await sleep(duration);
                    assert.deepStrictEqual(delays, expected_delays);
                    assert.strictEqual(elapsed(), duration);
                });
            }
        });

        it("should reapply the fractional policy to the remaining long wait", async () => {
            await withTimerClock(async (elapsed, delays) => {
                await sleep(160000);
                assert.deepStrictEqual(delays, [120000, 30000, 9500, 500]);
                assert.strictEqual(elapsed(), 160000);
            });
        });

        it("should preserve requested duration beyond the platform timer limit", async () => {
            await withTimerClock(async (elapsed, delays) => {
                const requested_duration = 2 * (2 ** 31 - 1) + 25;
                await sleep(requested_duration);
                assert.strictEqual(elapsed(), requested_duration);
                assert.strictEqual(delays[0], 2 ** 31 - 1);
                assert.isTrue(delays.every((delay) => delay <= 2 ** 31 - 1));
            });
        });

        it("should count late callbacks toward the remaining duration", async () => {
            await withTimerClock(async (elapsed, delays) => {
                await sleep(10000);
                assert.deepStrictEqual(delays, [9500, 375]);
                assert.strictEqual(elapsed(), 10125);
            }, 125);
        });

        it("should stop when a late callback covers the entire remaining wait", async () => {
            await withTimerClock(async (elapsed, delays) => {
                await sleep(10000);
                assert.deepStrictEqual(delays, [9500]);
                assert.strictEqual(elapsed(), 10100);
            }, 600);
        });

        it("should trust a fractional final timer without correcting platform truncation", async () => {
            await withTimerClock(async (elapsed, delays) => {
                await sleep(25.5);
                assert.deepStrictEqual(delays, [25.5]);
                assert.strictEqual(elapsed(), 25);
            });
        });

        it("should stop after an early final timer at the threshold or after a longer wait", async () => {
            const cases: Array<[number, number[], number]> = [
                [1000, [1000], 900],
                [10000, [9500, 600], 9900],
            ];
            for(const [duration, expected_delays, expected_elapsed] of cases) {
                await withTimerClock(async (elapsed, delays) => {
                    await sleep(duration);
                    assert.deepStrictEqual(delays, expected_delays);
                    assert.strictEqual(elapsed(), expected_elapsed);
                }, -100);
            }
        });

        it("should yield asynchronously for nonpositive durations", async () => {
            for(const duration of [0, -1]) {
                await withTimerClock(async (elapsed) => {
                    let settled = false;
                    const pending = sleep(duration).then(() => { settled = true; });
                    assert.isFalse(settled);
                    await pending;
                    assert.strictEqual(elapsed(), 1);
                });
            }
        });

        it("should reject nonfinite durations", async () => {
            await withTimerClock(async (elapsed) => {
                for(const duration of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
                    await sleep(duration).then(
                        () => assert.fail("Expected a nonfinite duration to reject"),
                        (error: unknown) => { assert.instanceOf(error, RangeError); },
                    );
                }
                assert.strictEqual(elapsed(), 0);
            });
        });
    });

    describe("identity", () => {
        it("should return the original value", () => {
            for(const value of [
                0, 42, Number.POSITIVE_INFINITY, "Hello!", true, {a: 1, b: 2},
            ]) {
                assert.strictEqual(identity(value), value);
            }
        });
    });

    describe("invoke", () => {
        it("should work as advertised", () => {
            assert.strictEqual(invoke(() => 42), 42);
        });
    });

    describe("nop", () => {
        it("should return undefined", () => {
            assert.strictEqual(nop(), (void 0));
            assert.strictEqual(nop(1, 2, 3), (void 0));
        });
    });
});

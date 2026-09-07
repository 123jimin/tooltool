import {assert} from "chai";

import {identity, invoke, nop, sleep} from "./basic.ts";

async function withTimerClock(run: (elapsed: () => number) => Promise<void>, lateness = 0): Promise<void> {
    const timeout_descriptor = Object.getOwnPropertyDescriptor(globalThis, "setTimeout")!;
    const now_descriptor = Object.getOwnPropertyDescriptor(performance, "now");
    let elapsed = 0;
    let timer_count = 0;
    Object.defineProperty(performance, "now", {configurable: true, value: () => elapsed});
    Object.defineProperty(globalThis, "setTimeout", {
        configurable: true,
        value: (callback: () => void, duration: number) => {
            if(++timer_count > 10) throw new Error("Sleep failed to make progress");
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
        await run(() => elapsed);
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

        it("should preserve requested duration beyond the platform timer limit", async () => {
            await withTimerClock(async (elapsed) => {
                const requested_duration = 2 * (2 ** 31 - 1) + 25;
                await sleep(requested_duration);
                assert.strictEqual(elapsed(), requested_duration);
            });
        });

        it("should count late callbacks toward the remaining duration", async () => {
            await withTimerClock(async (elapsed) => {
                await sleep(2 ** 31 - 1 + 25);
                assert.strictEqual(elapsed(), 2 ** 31 - 1 + 40);
            }, 40);
        });

        it("should not finish fractional delays early when timers truncate them", async () => {
            await withTimerClock(async (elapsed) => {
                await sleep(25.5);
                assert.isAtLeast(elapsed(), 25.5);
                assert.isBelow(elapsed(), 26.5);
            });
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

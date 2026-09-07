import {assert} from "chai";

import {rateLimited} from "./rate-limit.ts";

async function withClock(run: (advance: (duration: number) => Promise<void>) => Promise<void>): Promise<void> {
    const timeout_descriptor = Object.getOwnPropertyDescriptor(globalThis, "setTimeout")!;
    const now_descriptor = Object.getOwnPropertyDescriptor(performance, "now");
    const original_timeout = globalThis.setTimeout;
    const timers = new Map<number, {at: number; callback: () => void}>();
    let now = 0;
    let timer_id = 0;
    const setNow = (time: number): void => { now = time; };
    const flush = () => new Promise<void>((resolve) => { original_timeout(resolve, 0); });

    Object.defineProperty(globalThis, "setTimeout", {
        configurable: true,
        value: (callback: () => void, duration = 0) => {
            timers.set(++timer_id, {at: now + duration, callback});
            return timer_id;
        },
    });
    Object.defineProperty(performance, "now", {configurable: true, value: () => now});

    const advance = async (duration: number) => {
        const target = now + duration;
        await flush();
        while(true) {
            let next_id: number|null = null;
            let next_time = Infinity;
            for(const [id, timer] of timers) {
                if(timer.at <= target && timer.at < next_time) {
                    next_id = id;
                    next_time = timer.at;
                }
            }
            if(next_id == null) break;
            const timer = timers.get(next_id)!;
            timers.delete(next_id);
            setNow(timer.at);
            timer.callback();
            await flush();
        }
        setNow(target);
        await flush();
    };

    try {
        await run(advance);
    } finally {
        Object.defineProperty(globalThis, "setTimeout", timeout_descriptor);
        if(now_descriptor == null) Reflect.deleteProperty(performance, "now");
        else Object.defineProperty(performance, "now", now_descriptor);
    }
}

describe("function/rate-limit", () => {
    describe("rateLimited", () => {
        it("should work as advertised", async () => {
            await withClock(async (advance) => {
                const starts: number[] = [];
                const limited = rateLimited(async (a: number, b: number) => {
                    starts.push(performance.now());
                    return a + b;
                }, 100);
                const first = limited(2, 3);
                const second = limited(4, 5);
                await advance(0);
                assert.deepStrictEqual(starts, [0]);
                assert.strictEqual(await first, 5);
                await advance(99);
                assert.deepStrictEqual(starts, [0]);
                await advance(1);
                assert.strictEqual(await second, 9);
                assert.deepStrictEqual(starts, [0, 100]);
            });
        });

        it("should retain the cooldown after the queue becomes idle", async () => {
            await withClock(async (advance) => {
                const starts: number[] = [];
                const limited = rateLimited(async () => { starts.push(performance.now()); }, 100);
                await limited();
                await advance(10);
                assert.strictEqual(limited.processing_count, 0);
                assert.strictEqual(limited.wait_count, 0);
                const second = limited();
                await advance(89);
                assert.deepStrictEqual(starts, [0]);
                assert.strictEqual(limited.wait_count, 1);
                await advance(1);
                await second;
                assert.deepStrictEqual(starts, [0, 100]);
            });
        });

        it("should serialize long-running work in FIFO order without adding an end-to-start delay", async () => {
            await withClock(async (advance) => {
                const first_work = Promise.withResolvers<void>();
                const starts: [number, number][] = [];
                const limited = rateLimited(async (id: number) => {
                    starts.push([id, performance.now()]);
                    if(id === 1) await first_work.promise;
                    return id;
                }, 100);
                const pending = [limited(1), limited(2), limited(3)];
                await advance(150);
                assert.deepStrictEqual(starts, [[1, 0]]);
                assert.strictEqual(limited.processing_count, 1);
                assert.strictEqual(limited.wait_count, 2);
                first_work.resolve();
                await advance(0);
                assert.deepStrictEqual(starts, [[1, 0], [2, 150]]);
                await advance(100);
                assert.deepStrictEqual(await Promise.all(pending), [1, 2, 3]);
                assert.deepStrictEqual(starts, [[1, 0], [2, 150], [3, 250]]);
                assert.strictEqual(limited.processing_count, 0);
                assert.strictEqual(limited.wait_count, 0);
            });
        });

        it("should count execution time toward the next start's cooldown", async () => {
            await withClock(async (advance) => {
                const first_work = Promise.withResolvers<void>();
                const starts: number[] = [];
                const limited = rateLimited(async () => {
                    starts.push(performance.now());
                    await first_work.promise;
                }, 100);
                const pending = [limited(), limited()];
                await advance(30);
                first_work.resolve();
                await advance(69);
                assert.deepStrictEqual(starts, [0]);
                await advance(1);
                await Promise.all(pending);
                assert.deepStrictEqual(starts, [0, 100]);
            });
        });

        it("should sample dynamic durations on scheduling and timer wakeups", async () => {
            await withClock(async (advance) => {
                let duration = 50;
                const starts: number[] = [];
                const limited = rateLimited(async () => { starts.push(performance.now()); }, () => duration);
                await limited();
                await advance(0);
                const second = limited();
                duration = 200;
                assert.strictEqual(limited.limit_duration_ms, 200);
                await advance(50);
                assert.deepStrictEqual(starts, [0]);
                await advance(149);
                assert.deepStrictEqual(starts, [0]);
                await advance(1);
                await second;
                duration = 25;
                const third = limited();
                await advance(25);
                await third;
                assert.deepStrictEqual(starts, [0, 200, 225]);
            });
        });

        it("should not wake an existing timer early when the dynamic duration decreases", async () => {
            await withClock(async (advance) => {
                let duration = 100;
                const starts: number[] = [];
                const limited = rateLimited(async () => { starts.push(performance.now()); }, () => duration);
                await limited();
                await advance(0);
                const second = limited();
                duration = 20;
                await advance(20);
                assert.deepStrictEqual(starts, [0]);
                await advance(80);
                await second;
                assert.deepStrictEqual(starts, [0, 100]);
            });
        });

        for(const synchronous of [false, true]) {
            context(synchronous ? "synchronous throws" : "promise rejections", () => {
                it("should propagate errors and continue queued work", async () => {
                    await withClock(async (advance) => {
                        const error = new Error("failed call");
                        const limited = rateLimited((id: number): Promise<number> => {
                            if(id !== 1) return Promise.resolve(id);
                            if(synchronous) throw error;
                            return Promise.reject(error);
                        }, 100);
                        const failure = limited(1).then(
                            () => assert.fail("expected rejection"),
                            (reason: unknown) => { assert.strictEqual(reason, error); },
                        );
                        const next = limited(2);
                        await advance(99);
                        await failure;
                        assert.strictEqual(limited.wait_count, 1);
                        await advance(1);
                        assert.strictEqual(await next, 2);
                        assert.strictEqual(limited.processing_count, 0);
                        assert.strictEqual(limited.wait_count, 0);
                    });
                });
            });
        }
    });
});

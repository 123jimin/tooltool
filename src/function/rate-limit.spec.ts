import {assert} from "chai";
import {rateLimited} from "./rate-limit.ts";

import {sleep} from "./basic.ts";

const TOLERANCE_MS = 10;

describe("function/rate-limit", () => {
    describe("rateLimited", () => {
        context("fixed duration", async function () {
            this.slow(500);
            this.timeout(5000);

            it("should expose documented getters", () => {
                const limited = rateLimited(async () => 42, 50);
                assert.strictEqual(typeof limited.limit_duration_ms, "number");
                assert.strictEqual(limited.limit_duration_ms, 50);
                assert.strictEqual(limited.wait_count, 0);
            });

            it("should return the wrapped function's resolved value and forward args", async () => {
                const fn = async (a: number, b: number) => a + b;
                const limited = rateLimited(fn, 30);
                const result = await limited(2, 3);
                assert.strictEqual(result, 5);
            });

            it("should queue calls and reflect wait_count while queued", async () => {
                let processed = 0;
                const fn = async () => {
                    ++processed;
                    await sleep(40);
                    return "ok";
                };

                const limited = rateLimited(fn, 50);

                const p1 = limited();
                const p2 = limited();
                const p3 = limited();

                assert.strictEqual(limited.wait_count, 2);
                assert.strictEqual(limited.processing_count, 1);

                const results = await Promise.all([p1, p2, p3]);

                assert.strictEqual(limited.wait_count, 0);
                assert.strictEqual(limited.processing_count, 0);

                assert.strictEqual(processed, 3);
                assert.deepStrictEqual(results, ["ok", "ok", "ok"]);
            });

            it("should process calls strictly in FIFO order", async () => {
                const seen: number[] = [];
                const fn = async (id: number) => {
                    seen.push(id);
                    await sleep(10);
                    return id;
                };

                const limited = rateLimited(fn, 30);
                const promises = [limited(1), limited(2), limited(3)];
                await Promise.all(promises);

                assert.deepStrictEqual(seen, [1, 2, 3]);
            });

            it("should enforce a minimum delay between call starts (no overlap)", async () => {
                const duration = 60;
                const starts: number[] = [];
                let concurrent = 0;
                let max_concurrent = 0;

                const fn = async () => {
                    starts.push(Date.now());
                    ++concurrent;
                    max_concurrent = Math.max(max_concurrent, concurrent);

                    await sleep(90);
                    --concurrent;
                };

                const limited = rateLimited(fn, duration);

                await Promise.all([limited(), limited(), limited()]);

                // Check no overlap occurred
                assert.strictEqual(max_concurrent, 1, "tasks must not overlap (sequential execution)");

                // Check minimum spacing between starts is at least `duration`
                for(let i = 1; i < starts.length; i++) {
                    const delta = starts[i]! - starts[i - 1]!;
                    assert.isAtLeast(
                        delta + TOLERANCE_MS,
                        duration,
                        `start #${i} should be >= ${duration}ms after previous start (got ~${delta}ms)`,
                    );
                }
            });

            it("first call should not be artificially delayed by the rate limiter", async () => {
                const duration = 80;
                let started_at: number | null = null;

                const fn = async () => { started_at = performance.now(); };
                const limited = rateLimited(fn, duration);

                const t0 = performance.now();
                await limited();

                assert.isNotNull(started_at);
                const delay = started_at - t0;

                // Implementation choice: we only assert it doesn't wait for the full duration.
                assert.isBelow(
                    delay,
                    duration/2,
                    `first call should begin promptly (observed ~${delay}ms)`,
                );
            });
        });

        context("dynamic duration", function () {
            this.slow(500);
            this.timeout(5000);

            it("should reflect dynamic limit via the getter", async () => {
                let d = 25;
                const limited = rateLimited(async () => {}, () => d);
                assert.strictEqual(limited.limit_duration_ms, 25);

                d = 40;
                assert.strictEqual(limited.limit_duration_ms, 40);
            });

            it("should respect changing durations between calls", async () => {
                let d = 40;
                const starts: number[] = [];

                const fn = async () => {
                    starts.push(performance.now());
                };

                const limited = rateLimited(fn, () => d);

                await limited();

                d = 80;
                await limited();

                d = 20;
                await limited();

                const delta1 = starts[1]! - starts[0]!;

                const delta2 = starts[2]! - starts[1]!;

                assert.isAtLeast(
                    delta1 + TOLERANCE_MS,
                    80,
                    `second call should start >=80ms after first (got ~${delta1}ms)`,
                );

                assert.isAtLeast(
                    delta2 + TOLERANCE_MS,
                    20,
                    `third call should start >=20ms after second (got ~${delta2}ms)`,
                );

                assert.isAtMost(
                    delta2 - TOLERANCE_MS,
                    50,
                    `third call should start not much more than 20ms after second (got ~${delta2}ms)`,
                );
            });
        });

        context("error handling", () => {
            it("should propagate rejections from the wrapped function", async () => {
                const err = new Error("boom");
                const limited = rateLimited(async () => {
                    await sleep(10);
                    throw err;
                }, 100);

                try {
                    await limited();
                    assert.fail("expected rejection");
                } catch (e) {
                    assert.strictEqual(e, err);
                }
            });

            it("should propagate synchronous throws from the wrapped function", async () => {
                const limited = rateLimited((): Promise<void> => { throw new Error("sync"); }, 10);
                try {
                    await limited();
                    assert.fail("expected synchronous throw to be observed as rejection");
                } catch (e) {
                    assert.strictEqual((e as Error).message, "sync");
                }
            });
        });
    });
});

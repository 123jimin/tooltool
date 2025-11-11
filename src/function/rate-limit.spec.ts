import { assert } from "chai";
import { rateLimited } from "./rate-limit.js";

import { sleep } from "./basic.js";

const TOLERANCE_MS = 10;

describe("function/rate-limit", () => {
    describe("rateLimited", () => {
        context("fixed duration", async function () {
            this.slow(250);

            it("should expose documented getters", () => {
                const limited = rateLimited(async () => 42, 50);
                assert.strictEqual(typeof limited.limit_duration_ms, "number");
                assert.strictEqual(limited.limit_duration_ms, 50);
                assert.strictEqual(limited.wait_count, 0);
            });

            it("should return the wrapped function's resolved value and forward args", async() => {
                const fn = async(a: number, b: number) => a + b;
                const limited = rateLimited(fn, 30);
                const result = await limited(2, 3);
                assert.strictEqual(result, 5);
            });

            it("should queue calls and reflect wait_count while queued", async() => {
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

                assert.strictEqual(limited.wait_count, 3);

                const results = await Promise.all([p1, p2, p3]);
                
                assert.strictEqual(limited.wait_count, 0);
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

            it("should enforce a minimum delay between call starts (no overlap)", async function () {
                this.timeout(5000);

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
                for (let i = 1; i < starts.length; i++) {
                    const delta = starts[i] - starts[i - 1];
                    assert.isAtLeast(
                        delta + TOLERANCE_MS,
                        duration,
                        `start #${i} should be >= ${duration}ms after previous start (got ~${delta}ms)`
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
                    `first call should begin promptly (observed ~${delay}ms)`
                );
            });
        });

        context("dynamic duration", () => {
            it("should reflect dynamic limit via the getter", async () => {
                let d = 25;
                const limited = rateLimited(async () => {}, () => d);
                assert.strictEqual(limited.limit_duration_ms, 25);

                d = 40;
                assert.strictEqual(limited.limit_duration_ms, 40);
            });

            it("should respect changing durations between calls", async function () {
                this.timeout(5000);

                // Sequence of durations we want to apply between starts: 30ms then 70ms
                const durations = [30, 70];
                let idx = 0;
                const limited = rateLimited(async () => { await sleep(10); }, () => durations[Math.min(idx, durations.length - 1)]);

                const starts: number[] = [];
                const wrapped = async () => {
                    starts.push(performance.now());
                    await limited();
                    ++idx; // advance duration for the next scheduling point
                };

                await wrapped(); // first call (no enforced gap before it)
                await wrapped(); // gap ≈ 30ms
                await wrapped(); // gap ≈ 70ms

                // Verify spacing for the two enforced gaps with tolerance
                const gap1 = starts[1] - starts[0];
                const gap2 = starts[2] - starts[1];

                assert.isAtLeast(gap1 + TOLERANCE_MS, 30, `gap1 should be >=30ms (got ~${gap1}ms)`);
                assert.isAtLeast(gap2 + TOLERANCE_MS, 70, `gap2 should be >=70ms (got ~${gap2}ms)`);
            });
        });

        context("error handling", () => {
            it("should propagate rejections from the wrapped function", async () => {
                const err = new Error("boom");
                const limited = rateLimited(async () => { await sleep(10); throw err; }, 100);

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
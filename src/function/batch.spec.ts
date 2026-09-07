import {assert} from "chai";

import {batchedForEach, batchedMap} from "./batch.ts";

describe("function/batch", () => {
    describe("batchedForEach", () => {
        it("should work as advertised", async () => {
            const batches: [number, number[]][] = [];
            await batchedForEach([1, 2, 3, 4, 5], 2, async (batch, index) => {
                batches.push([index, batch]);
            });
            assert.deepStrictEqual(batches, [[0, [1, 2]], [2, [3, 4]], [4, [5]]]);
        });

        it("should await each batch and isolate structural mutations from the input", async () => {
            const first_batch = Promise.withResolvers<void>();
            const source = [1, 2, 3];
            const seen: number[] = [];
            const pending = batchedForEach(source, 2, async (batch, index) => {
                seen.push(index);
                batch.splice(0);
                if(index === 0) await first_batch.promise;
            });
            await Promise.resolve();
            assert.deepStrictEqual(seen, [0]);
            assert.deepStrictEqual(source, [1, 2, 3]);
            first_batch.resolve();
            await pending;
            assert.deepStrictEqual(seen, [0, 2]);
            assert.deepStrictEqual(source, [1, 2, 3]);
        });

        it("should use one copied batch for size zero, including an empty input", async () => {
            for(const source of [[1, 2, 3], []]) {
                const batches: [number, number[]][] = [];
                const original = source.slice();
                await batchedForEach(source, 0, async (batch, index) => {
                    batches.push([index, batch.slice()]);
                    batch.push(4);
                });
                assert.deepStrictEqual(batches, [[0, original]]);
                assert.deepStrictEqual(source, original);
            }
            await batchedForEach([], 1, async () => { assert.fail("empty input has no positive-size batches"); });
        });

        it("should propagate a callback rejection without processing later batches", async () => {
            const error = new Error("batch failed");
            const seen: number[] = [];
            await batchedForEach([1, 2, 3], 1, async (_batch, index) => {
                seen.push(index);
                if(index === 1) throw error;
            }).then(
                () => assert.fail("expected rejection"),
                (reason: unknown) => { assert.strictEqual(reason, error); },
            );
            assert.deepStrictEqual(seen, [0, 1]);
        });
    });

    describe("batchedMap", () => {
        it("should work as advertised", async () => {
            assert.deepStrictEqual(await batchedMap([1, 2, 3], 2, async (batch) => batch.map((value) => value * 2)), [2, 4, 6]);
        });

        it("should append large mapper results without a function argument limit", async () => {
            const large_result = Array.from({length: 200_000}, (_, index) => index);
            for(const batch_size of [0, 1]) {
                const result = await batchedMap([1], batch_size, async () => large_result);
                assert.deepStrictEqual(result, large_result);
                result.push(-1);
                assert.strictEqual(large_result.length, 200_000);
            }
        });

        it("should omit nullish and empty results while retaining result order", async () => {
            const result = await batchedMap([0, 1, 2, 3, 4], 1, async (_batch, index) => {
                if(index === 1) return null;
                if(index === 2) return void 0;
                if(index === 3) return [];
                return [index, index + 10];
            });
            assert.deepStrictEqual(result, [0, 10, 4, 14]);
            assert.deepStrictEqual(await batchedMap([1], 0, async () => null), []);
        });

        it("should await mappers and isolate structural mutations from the input", async () => {
            const first_batch = Promise.withResolvers<number[]>();
            const source = [1, 2, 3];
            const seen: number[] = [];
            const pending = batchedMap(source, 2, async (batch, index) => {
                seen.push(index);
                batch.splice(0);
                return index === 0 ? first_batch.promise : [index];
            });
            await Promise.resolve();
            assert.deepStrictEqual(seen, [0]);
            first_batch.resolve([10]);
            assert.deepStrictEqual(await pending, [10, 2]);
            assert.deepStrictEqual(source, [1, 2, 3]);
        });

        it("should map one copied batch for size zero, including an empty input", async () => {
            for(const source of [[1, 2, 3], []]) {
                const original = source.slice();
                const indexes: number[] = [];
                const result = await batchedMap(source, 0, async (batch, index) => {
                    indexes.push(index);
                    batch.push(4);
                    return batch;
                });
                assert.deepStrictEqual(indexes, [0]);
                assert.deepStrictEqual(result, [...original, 4]);
                assert.deepStrictEqual(source, original);
            }
            assert.deepStrictEqual(await batchedMap([], 1, async () => {
                assert.fail("empty input has no positive-size batches");
            }), []);
        });

        it("should propagate a mapper rejection without processing later batches", async () => {
            const error = new Error("mapper failed");
            const seen: number[] = [];
            await batchedMap([1, 2, 3], 1, async (_batch, index) => {
                seen.push(index);
                if(index === 1) throw error;
                return [index];
            }).then(
                () => assert.fail("expected rejection"),
                (reason: unknown) => { assert.strictEqual(reason, error); },
            );
            assert.deepStrictEqual(seen, [0, 1]);
        });
    });

    it("should reject invalid batch sizes before invoking either callback", async () => {
        for(const batch_size of [-1, 0.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1]) {
            let called = false;
            const callback = async (): Promise<never> => {
                called = true;
                return assert.fail("invalid sizes must not invoke callbacks");
            };
            for(const pending of [batchedForEach([1], batch_size, callback), batchedMap([1], batch_size, callback)]) {
                await pending.then(
                    () => assert.fail("expected invalid batch size rejection"),
                    (error: unknown) => { assert.instanceOf(error, Error); },
                );
            }
            assert.isFalse(called);
        }
    });
});

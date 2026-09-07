import {assert} from "chai";

import {batched} from "./batch.ts";
import {range} from "./range.ts";

describe("iterator/batch", () => {
    describe("batched", () => {
        it("should work as advertised", () => {
            assert.deepStrictEqual(
                [...batched(range(10), 3)],
                [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9]],
            );
        });

        context("sync generators", () => {
            it("should yield full batches when count is divisible by batch size", () => {
                assert.deepStrictEqual(
                    [...batched(range(6), 2)],
                    [[0, 1], [2, 3], [4, 5]],
                );
                assert.deepStrictEqual(
                    [...batched(range(9), 3)],
                    [[0, 1, 2], [3, 4, 5], [6, 7, 8]],
                );
            });

            it("should yield a partial batch at the end when count is not divisible by batch size", () => {
                assert.deepStrictEqual(
                    [...batched(range(5), 2)],
                    [[0, 1], [2, 3], [4]],
                );
                assert.deepStrictEqual(
                    [...batched(range(7), 3)],
                    [[0, 1, 2], [3, 4, 5], [6]],
                );
            });

            it("should yield an empty generator when source is empty", () => {
                assert.deepStrictEqual([...batched(range(0), 3)], []);
            });

            it("should yield single-element batches when batch size is 1", () => {
                assert.deepStrictEqual(
                    [...batched(range(4), 1)],
                    [[0], [1], [2], [3]],
                );
            });

            it("should yield one batch when batch size exceeds source length", () => {
                assert.deepStrictEqual(
                    [...batched(range(3), 10)],
                    [[0, 1, 2]],
                );
            });

            it("should yield one batch when batch size equals source length", () => {
                assert.deepStrictEqual(
                    [...batched(range(5), 5)],
                    [[0, 1, 2, 3, 4]],
                );
            });

            it("should collect the complete source into one batch when size is zero", () => {
                assert.deepStrictEqual([...batched(range(5), 0)], [[0, 1, 2, 3, 4]]);
                assert.deepStrictEqual([...batched(range(0), 0)], []);
            });

            it("should reject invalid sizes before consuming the source", () => {
                let started = false;
                function* source() {
                    started = true;
                    yield 1;
                }
                const gen = source();
                for(const size of [-1, 0.5, 1.5, NaN, Infinity, -Infinity]) {
                    assert.throws(() => batched(gen, size), RangeError);
                }
                assert.isFalse(started);
                assert.deepStrictEqual(gen.next(), {value: 1, done: false});
                gen.return();
            });

            it("should close the source when a consumer exits after a batch", () => {
                let closed = false;
                function* source() {
                    try {
                        yield 1;
                        yield 2;
                        yield 3;
                    } finally {
                        closed = true;
                    }
                }
                const batches = batched(source(), 2);
                assert.deepStrictEqual(batches.next(), {value: [1, 2], done: false});
                assert.isFalse(closed);
                batches.return(void 0);
                assert.isTrue(closed);
            });

            it("should propagate a source error without yielding an incomplete batch", () => {
                const source_error = new Error("source failure");
                let closed = false;
                function* source() {
                    try {
                        yield 1;
                        throw source_error;
                    } finally {
                        closed = true;
                    }
                }
                const batches = batched(source(), 0);
                assert.throws(() => batches.next(), source_error);
                assert.isTrue(closed);
            });
        });

        context("async generators", () => {
            async function* asyncRange(n: number): AsyncGenerator<number> {
                for(let i = 0; i < n; i++) {
                    yield i;
                }
            }

            async function collectAsync<T>(gen: AsyncGenerator<T>): Promise<T[]> {
                const result: T[] = [];
                for await (const item of gen) {
                    result.push(item);
                }
                return result;
            }

            it("should yield full batches when count is divisible by batch size", async () => {
                assert.deepStrictEqual(
                    await collectAsync(batched(asyncRange(6), 2)),
                    [[0, 1], [2, 3], [4, 5]],
                );
            });

            it("should yield a partial batch at the end when count is not divisible by batch size", async () => {
                assert.deepStrictEqual(
                    await collectAsync(batched(asyncRange(7), 3)),
                    [[0, 1, 2], [3, 4, 5], [6]],
                );
            });

            it("should yield an empty generator when source is empty", async () => {
                assert.deepStrictEqual(
                    await collectAsync(batched(asyncRange(0), 3)),
                    [],
                );
            });

            it("should yield single-element batches when batch size is 1", async () => {
                assert.deepStrictEqual(
                    await collectAsync(batched(asyncRange(4), 1)),
                    [[0], [1], [2], [3]],
                );
            });

            it("should yield one batch when batch size exceeds source length", async () => {
                assert.deepStrictEqual(
                    await collectAsync(batched(asyncRange(3), 10)),
                    [[0, 1, 2]],
                );
            });

            it("should collect the complete async source into one batch when size is zero", async () => {
                assert.deepStrictEqual(await collectAsync(batched(asyncRange(5), 0)), [[0, 1, 2, 3, 4]]);
                assert.deepStrictEqual(await collectAsync(batched(asyncRange(0), 0)), []);
            });

            it("should reject invalid sizes before consuming the async source", async () => {
                let started = false;
                async function* source() {
                    started = true;
                    yield 1;
                }
                const gen = source();
                for(const size of [-1, 0.5, 1.5, NaN, Infinity, -Infinity]) {
                    assert.throws(() => batched(gen, size), RangeError);
                }
                assert.isFalse(started);
                assert.deepStrictEqual(await gen.next(), {value: 1, done: false});
                await gen.return();
            });

            it("should await async source cleanup when a consumer exits after a batch", async () => {
                const cleanup_started = Promise.withResolvers<void>();
                const finish_cleanup = Promise.withResolvers<void>();
                let closed = false;
                async function* source() {
                    try {
                        yield 1;
                        yield 2;
                        yield 3;
                    } finally {
                        cleanup_started.resolve();
                        await finish_cleanup.promise;
                        closed = true;
                    }
                }
                const batches = batched(source(), 2);
                assert.deepStrictEqual(await batches.next(), {value: [1, 2], done: false});
                const consume = batches.return(void 0).then(() => { assert.isTrue(closed); });
                await cleanup_started.promise;
                assert.isFalse(closed);
                finish_cleanup.resolve();
                await consume;
            });

            it("should propagate an async source error without yielding an incomplete batch", async () => {
                const source_error = new Error("async source failure");
                let closed = false;
                async function* source() {
                    try {
                        yield 1;
                        throw source_error;
                    } finally {
                        closed = true;
                    }
                }
                const batches = batched(source(), 0);
                assert.strictEqual(await batches.next().catch((reason: unknown) => reason), source_error);
                assert.isTrue(closed);
            });
        });
    });
});

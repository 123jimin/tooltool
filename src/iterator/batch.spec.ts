import { assert } from "chai";
import { batched } from "./batch.ts";
import { range } from "./range.ts";

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
        });

        context("async generators", () => {
            async function* asyncRange(n: number): AsyncGenerator<number> {
                for (let i = 0; i < n; i++) {
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
        });
    });
});

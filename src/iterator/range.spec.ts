import {assert} from "chai";
import {range} from "./range.ts";

describe("iterator/range", () => {
    describe("range", () => {
        it("should work as advertised in the documentation", () => {
            assert.deepStrictEqual([...range(5)], [0, 1, 2, 3, 4]);
            assert.deepStrictEqual([...range(5, 10)], [5, 6, 7, 8, 9]);
            assert.deepStrictEqual([...range(0, 10, 2)], [0, 2, 4, 6, 8]);
            assert.deepStrictEqual([...range(5, 0, -1)], [5, 4, 3, 2, 1]);
            assert.deepStrictEqual([...range(5, 0)], []);
            assert.deepStrictEqual([...range(0n, 5n)], [0n, 1n, 2n, 3n, 4n]);
        });

        context("one argument", () => {
            it("should return an empty generator when the argument is 0", () => {
                assert.deepStrictEqual([...range(0)], []);
                assert.deepStrictEqual([...range(0n)], []);
            });

            it("should behave correctly when the argument is positive", () => {
                assert.deepStrictEqual([...range(10)], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
                assert.deepStrictEqual([...range(10n)], [0n, 1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n]);
            });

            it("should return an empty generator when the argument is negative", () => {
                assert.deepStrictEqual([...range(-10)], []);
                assert.deepStrictEqual([...range(-10n)], []);
            });
        });

        context("two arguments", () => {
            it("should work correctly when start < end", () => {
                assert.deepStrictEqual([...range(1, 5)], [1, 2, 3, 4]);
                assert.deepStrictEqual([...range(-5, -1)], [-5, -4, -3, -2]);
                assert.deepStrictEqual([...range(-3, 3)], [-3, -2, -1, 0, 1, 2]);

                assert.deepStrictEqual([...range(1n, 5n)], [1n, 2n, 3n, 4n]);
                assert.deepStrictEqual([...range(-5n, -1n)], [-5n, -4n, -3n, -2n]);
                assert.deepStrictEqual([...range(-3n, 3n)], [-3n, -2n, -1n, 0n, 1n, 2n]);
            });

            it("should return an empty generator when start >= end", () => {
                assert.deepStrictEqual([...range(5, 1)], []);
                assert.deepStrictEqual([...range(5, 5)], []);
                assert.deepStrictEqual([...range(-1, -5)], []);
                assert.deepStrictEqual([...range(-5, -5)], []);

                assert.deepStrictEqual([...range(5n, 1n)], []);
                assert.deepStrictEqual([...range(5n, 5n)], []);
                assert.deepStrictEqual([...range(-1n, -5n)], []);
                assert.deepStrictEqual([...range(-5n, -5n)], []);
            });
        });

        context("three arguments", () => {
            context("when step is positive", () => {
                it("should work correctly when start < end", () => {
                    assert.deepStrictEqual([...range(0, 10, 3)], [0, 3, 6, 9]);
                    assert.deepStrictEqual([...range(-10, 0, 2)], [-10, -8, -6, -4, -2]);
                    assert.deepStrictEqual([...range(0, 9, 3)], [0, 3, 6]);

                    assert.deepStrictEqual([...range(0n, 10n, 3n)], [0n, 3n, 6n, 9n]);
                    assert.deepStrictEqual([...range(-10n, 0n, 2n)], [-10n, -8n, -6n, -4n, -2n]);
                    assert.deepStrictEqual([...range(0n, 9n, 3n)], [0n, 3n, 6n]);
                });

                it("should return an empty generator when start >= end", () => {
                    assert.deepStrictEqual([...range(10, 0, 2)], []);
                    assert.deepStrictEqual([...range(5, 5, 2)], []);

                    assert.deepStrictEqual([...range(10n, 0n, 2n)], []);
                    assert.deepStrictEqual([...range(5n, 5n, 2n)], []);
                });
            });

            context("when step is negative", () => {
                it("should work correctly when start > end", () => {
                    assert.deepStrictEqual([...range(10, 0, -2)], [10, 8, 6, 4, 2]);
                    assert.deepStrictEqual([...range(0, -10, -3)], [0, -3, -6, -9]);
                    assert.deepStrictEqual([...range(9, 0, -3)], [9, 6, 3]);

                    assert.deepStrictEqual([...range(10n, 0n, -2n)], [10n, 8n, 6n, 4n, 2n]);
                    assert.deepStrictEqual([...range(0n, -10n, -3n)], [0n, -3n, -6n, -9n]);
                    assert.deepStrictEqual([...range(9n, 0n, -3n)], [9n, 6n, 3n]);
                });

                it("should return an empty generator when start <= end", () => {
                    assert.deepStrictEqual([...range(0, 10, -2)], []);
                    assert.deepStrictEqual([...range(5, 5, -2)], []);

                    assert.deepStrictEqual([...range(0n, 10n, -2n)], []);
                    assert.deepStrictEqual([...range(5n, 5n, -2n)], []);
                });
            });

            it("should throw when step is 0", () => {
                assert.throws(() => [...range(1, 10, 0)]);
                assert.throws(() => [...range(1n, 10n, 0n)]);
            });
        });
    });
});

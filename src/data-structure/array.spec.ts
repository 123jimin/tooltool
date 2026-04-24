import {assert} from "chai";
import {partition, arrayGetOrExtend, arrayGetOrExtendWith} from "./array.ts";

describe("data-structure/array", () => {
    describe("partition", () => {
        it("should work as advertised", () => {
            assert.deepStrictEqual(partition([1, 2, 3, 4], (n) => n % 2 === 0), [[1, 3], [2, 4]]);
        });

        it("should return two empty arrays for an empty input", () => {
            assert.deepStrictEqual(partition([], () => true), [[], []]);
        });

        it("should put all elements in truthy when predicate always returns true", () => {
            assert.deepStrictEqual(partition([1, 2, 3], () => true), [[], [1, 2, 3]]);
        });

        it("should put all elements in falsey when predicate always returns false", () => {
            assert.deepStrictEqual(partition([1, 2, 3], () => false), [[1, 2, 3], []]);
        });

        it("should preserve element order within each partition", () => {
            const [falsey, truthy] = partition([5, 1, 4, 2, 3], (n) => n <= 2);
            assert.deepStrictEqual(falsey, [5, 4, 3]);
            assert.deepStrictEqual(truthy, [1, 2]);
        });

        it("should pass index and array to the predicate", () => {
            const indices: number[] = [];
            partition([10, 20, 30], (_v, i) => { indices.push(i); return false; });
            assert.deepStrictEqual(indices, [0, 1, 2]);
        });
    });

    describe("arrayGetOrExtend", () => {
        it("should return the existing element when index is in bounds", () => {
            const arr = [{x: 1}, {x: 2}];
            assert.strictEqual(arrayGetOrExtend(arr, 0, {x: 0}), arr[0]);
            assert.strictEqual(arr.length, 2);
        });

        it("should extend the array with shallow copies up to the index", () => {
            const arr: Array<{x: number}> = [];
            const result = arrayGetOrExtend(arr, 2, {x: 0});
            assert.strictEqual(arr.length, 3);
            assert.deepStrictEqual(result, {x: 0});
        });

        it("should create independent shallow copies for each new entry", () => {
            const arr: Array<{x: number}> = [];
            arrayGetOrExtend(arr, 1, {x: 0});
            arr[0]!.x = 99;
            assert.strictEqual(arr[1]!.x, 0);
        });

        it("should throw RangeError for a negative index", () => {
            assert.throws(() => arrayGetOrExtend([], -1, {x: 0}), RangeError);
        });

        it("should handle extending by exactly one element", () => {
            const arr = [{x: 1}];
            const result = arrayGetOrExtend(arr, 1, {x: 0});
            assert.strictEqual(arr.length, 2);
            assert.deepStrictEqual(result, {x: 0});
        });
    });

    describe("arrayGetOrExtendWith", () => {
        it("should return the existing element when index is in bounds", () => {
            const arr = [{x: 1}, {x: 2}];
            assert.strictEqual(arrayGetOrExtendWith(arr, 0, (i) => ({x: i})), arr[0]);
            assert.strictEqual(arr.length, 2);
        });

        it("should extend the array using the factory function", () => {
            const arr: Array<{x: number}> = [];
            const result = arrayGetOrExtendWith(arr, 2, (i) => ({x: i}));
            assert.strictEqual(arr.length, 3);
            assert.deepStrictEqual(arr, [{x: 0}, {x: 1}, {x: 2}]);
            assert.deepStrictEqual(result, {x: 2});
        });

        it("should throw RangeError for a negative index", () => {
            assert.throws(() => arrayGetOrExtendWith([], -1, (i) => ({x: i})), RangeError);
        });

        it("should call the factory with the correct indices", () => {
            const arr = [{x: 10}];
            arrayGetOrExtendWith(arr, 3, (i) => ({x: i}));
            assert.deepStrictEqual(arr, [{x: 10}, {x: 1}, {x: 2}, {x: 3}]);
        });
    });
});

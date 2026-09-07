import {assert} from "chai";

import {arrayGetOrExtend, arrayGetOrExtendWith, partition} from "./array.ts";

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
            partition([10, 20, 30], (_v, i) => {
                indices.push(i);
                return false;
            });
            assert.deepStrictEqual(indices, [0, 1, 2]);
        });
    });

    describe("arrayGetOrExtend", () => {
        it("should work as advertised", () => {
            const rows: number[][] = [];
            const template = [0];
            const row = arrayGetOrExtend(rows, 1, template);
            assert.deepStrictEqual(rows, [[0], [0]]);
            assert.strictEqual(row, rows[1]);
            rows[0]!.push(1);
            assert.deepStrictEqual(row, [0]);
            assert.deepStrictEqual(template, [0]);
        });

        it("should extend with scalar defaults without boxing or replacing them", () => {
            for(const value of [4n, "foo", null, 0, false, Symbol("value"), void 0]) {
                const arr: Array<typeof value> = [];
                assert.strictEqual(arrayGetOrExtend(arr, 2, value), value);
                assert.deepStrictEqual(arr, [value, value, value]);
            }
        });

        it("should preserve scalar result types and existing null entries", () => {
            const values: bigint[] = [];
            const value: bigint = arrayGetOrExtend(values, 2, 4n);
            assert.strictEqual(value, 4n);
            const nullable_values: Array<string | null> = [null];
            assert.strictEqual(arrayGetOrExtend(nullable_values, 0, "foo"), null);
            assert.deepStrictEqual(nullable_values, [null]);
        });

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

        it("should reject invalid indices before reading or extending", () => {
            const arr = [{x: 1}];
            for(const index of [-1, 0.5, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 32 - 1]) {
                assert.throws(() => arrayGetOrExtend(arr, index, {x: 0}), RangeError);
            }
            assert.deepStrictEqual(arr, [{x: 1}]);
        });

        it("should preserve nested references in shallow record copies", () => {
            const template = {nested: {value: 1}};
            const arr: Array<typeof template> = [];
            const value = arrayGetOrExtend(arr, 1, template);
            assert.notStrictEqual(value, template);
            assert.notStrictEqual(value, arr[0]);
            assert.strictEqual(value.nested, template.nested);
        });

        it("should preserve null-prototype records", () => {
            const template = Object.assign(Object.create(null) as Record<string, number>, {value: 1});
            const value = arrayGetOrExtend([], 0, template);
            assert.strictEqual(Object.getPrototypeOf(value), null);
            assert.deepStrictEqual(value, template);
            assert.notStrictEqual(value, template);
        });

        it("should reject unsupported templates without extending", () => {
            class Entry {
                value = 1;
            }
            for(const template of [new Date(0), new Map(), new Set(), new Entry()]) {
                const arr: object[] = [];
                assert.throws(() => arrayGetOrExtend(arr, 1, template), TypeError);
                assert.deepStrictEqual(arr, []);
            }
        });

        it("should return existing entries without copying unsupported templates", () => {
            const value = new Date(0);
            assert.strictEqual(arrayGetOrExtend([value], 0, new Date(1)), value);
        });

        it("should handle extending by exactly one element", () => {
            const arr = [{x: 1}];
            const result = arrayGetOrExtend(arr, 1, {x: 0});
            assert.strictEqual(arr.length, 2);
            assert.deepStrictEqual(result, {x: 0});
        });
    });

    describe("arrayGetOrExtendWith", () => {
        it("should work as advertised", () => {
            const dates: Date[] = [];
            const value = arrayGetOrExtendWith(dates, 1, (i) => new Date(i));
            assert.strictEqual(value.getTime(), 1);
            assert.deepStrictEqual(dates.map((date) => date.getTime()), [0, 1]);
        });

        it("should return the existing element when index is in bounds", () => {
            const arr = [{x: 1}, {x: 2}];
            assert.strictEqual(arrayGetOrExtendWith(arr, 0, () => {
                throw new Error("factory must not run for an existing entry");
            }), arr[0]);
            assert.strictEqual(arr.length, 2);
        });

        it("should extend the array using the factory function", () => {
            const arr: Array<{x: number}> = [];
            const result = arrayGetOrExtendWith(arr, 2, (i) => ({x: i}));
            assert.strictEqual(arr.length, 3);
            assert.deepStrictEqual(arr, [{x: 0}, {x: 1}, {x: 2}]);
            assert.deepStrictEqual(result, {x: 2});
        });

        it("should reject invalid indices without invoking the factory", () => {
            const arr = [{x: 1}];
            let calls = 0;
            for(const index of [-1, 0.5, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 32 - 1]) {
                assert.throws(() => arrayGetOrExtendWith(arr, index, () => {
                    ++calls;
                    return {x: 0};
                }), RangeError);
            }
            assert.strictEqual(calls, 0);
            assert.deepStrictEqual(arr, [{x: 1}]);
        });

        it("should call the factory with the correct indices", () => {
            const arr = [{x: 10}];
            arrayGetOrExtendWith(arr, 3, (i) => ({x: i}));
            assert.deepStrictEqual(arr, [{x: 10}, {x: 1}, {x: 2}, {x: 3}]);
        });
    });
});

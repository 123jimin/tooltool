import { assert } from "chai";
import { multimapAdd } from "./multimap.js";

describe("data-structure/multimap", () => {
    describe("multimapAdd", () => {
        context("with Map", () => {
            it("should work as advertised", () => {
                // Example 1
                const mm1 = new Map<string, number[]>();
                multimapAdd(mm1, "a", 1);
                multimapAdd(mm1, "a", 2);
                assert.deepStrictEqual(mm1.get("a"), [1, 2]);

                // Example 2
                const mm2 = new Map<number, boolean[]>();
                const arr = multimapAdd(mm2, 42, true);
                assert.deepStrictEqual(arr, [true]);
                assert.strictEqual(mm2.get(42), arr);
            });

            it("should create a new array if key does not exist", () => {
                const mm = new Map<string, number[]>();
                multimapAdd(mm, "a", 1);

                assert.deepStrictEqual(mm.get("a"), [1]);
            });

            it("should append to existing array if key exists", () => {
                const mm = new Map<string, number[]>();
                multimapAdd(mm, "a", 1);
                multimapAdd(mm, "a", 2);
                multimapAdd(mm, "a", 3);

                assert.deepStrictEqual(mm.get("a"), [1, 2, 3]);
            });

            it("should return the array associated with the key", () => {
                const mm = new Map<string, number[]>();
                const arr1 = multimapAdd(mm, "a", 1);
                const arr2 = multimapAdd(mm, "a", 2);

                assert.strictEqual(mm.get("a"), arr1);
                assert.strictEqual(arr1, arr2);
            });

            it("should handle multiple keys independently", () => {
                const mm = new Map<string, string[]>();
                multimapAdd(mm, "fruits", "apple");
                multimapAdd(mm, "fruits", "banana");
                multimapAdd(mm, "vegetables", "carrot");

                assert.deepStrictEqual(mm.get("fruits"), ["apple", "banana"]);
                assert.deepStrictEqual(mm.get("vegetables"), ["carrot"]);
            });
        });

        context("with Record", () => {
            it("should work as advertised", () => {
                // Example 1
                const mm1: Record<string, string[]> = {};
                multimapAdd(mm1, "fruits", "apple");
                multimapAdd(mm1, "fruits", "banana");
                multimapAdd(mm1, "vegetables", "carrot");
                assert.deepStrictEqual(mm1["fruits"], ["apple", "banana"]);
                assert.deepStrictEqual(mm1["vegetables"], ["carrot"]);

                // Example 2
                const mm2: Record<number, boolean[]> = {};
                const arr = multimapAdd(mm2, 42, true);
                assert.deepStrictEqual(arr, [true]);
                assert.strictEqual(mm2[42], arr);
            });

            it("should create a new array if key does not exist", () => {
                const mm: Record<string, number[]> = {};
                multimapAdd(mm, "a", 1);

                assert.deepStrictEqual(mm["a"], [1]);
            });

            it("should append to existing array if key exists", () => {
                const mm: Record<string, number[]> = {};
                multimapAdd(mm, "a", 1);
                multimapAdd(mm, "a", 2);
                multimapAdd(mm, "a", 3);

                assert.deepStrictEqual(mm["a"], [1, 2, 3]);
            });

            it("should return the array associated with the key", () => {
                const mm: Record<string, number[]> = {};
                const arr1 = multimapAdd(mm, "a", 1);
                const arr2 = multimapAdd(mm, "a", 2);

                assert.strictEqual(mm["a"], arr1);
                assert.strictEqual(arr1, arr2);
            });

            it("should handle multiple keys independently", () => {
                const mm: Record<string, string[]> = {};
                multimapAdd(mm, "fruits", "apple");
                multimapAdd(mm, "fruits", "banana");
                multimapAdd(mm, "vegetables", "carrot");

                assert.deepStrictEqual(mm["fruits"], ["apple", "banana"]);
                assert.deepStrictEqual(mm["vegetables"], ["carrot"]);
            });

            it("should handle numeric keys", () => {
                const mm: Record<number, string[]> = {};
                multimapAdd(mm, 1, "one");
                multimapAdd(mm, 1, "uno");
                multimapAdd(mm, 2, "two");

                assert.deepStrictEqual(mm[1], ["one", "uno"]);
                assert.deepStrictEqual(mm[2], ["two"]);
            });
        });
    });
});
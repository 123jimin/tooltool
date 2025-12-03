import { assert } from "chai";
import { multimapAdd } from "./multimap.js";

describe("data-structure/multimap", () => {
    describe("multimapAdd", () => {
        it("should working as expected (example 1)", () => {
            const mm = new Map<string, number[]>();
            multimapAdd(mm, "a", 1);
            multimapAdd(mm, "a", 2);

            assert.deepStrictEqual(mm.get("a"), [1, 2]);
        });
        
        it("should working as expected (example 2)", () => {
            const mm = new Map<string, string[]>();
            multimapAdd(mm, "fruits", "apple");
            multimapAdd(mm, "fruits", "banana");
            multimapAdd(mm, "vegetables", "carrot");

            assert.deepStrictEqual(mm.get("fruits"), ["apple", "banana"]);
            assert.deepStrictEqual(mm.get("vegetables"), ["carrot"]);
        });
        
        it("should working as expected (example 3)", () => {
            const mm = new Map<number, boolean[]>();
            const arr = multimapAdd(mm, 42, true);

            assert.deepStrictEqual(arr, [true]);
            assert.strictEqual(mm.get(42), arr);
        });
    });
});
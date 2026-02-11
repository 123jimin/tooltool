import {assert} from "chai";
import {multimapAdd, partitionToMultimap} from "./multimap.ts";

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

    describe("partitionToMultimap", () => {
        it("should work as advertised", () => {
            const numbers = [1, 2, 3, 4, 5];
            const parity = partitionToMultimap(numbers, (n) => (n % 2 === 0 ? "even" : "odd"));

            assert.deepStrictEqual(parity.get("odd"), [1, 3, 5]);
            assert.deepStrictEqual(parity.get("even"), [2, 4]);
        });

        it("returns an empty map when input array is empty", () => {
            const result = partitionToMultimap([], (x) => x);
            assert.strictEqual(result.size, 0);
        });

        it("groups all elements under a single key if they all map to it", () => {
            const input = ["a", "b", "c"];
            const result = partitionToMultimap(input, () => "key");

            assert.strictEqual(result.size, 1);
            assert.deepStrictEqual(result.get("key"), ["a", "b", "c"]);
        });

        it("creates distinct entries for unique keys", () => {
            const input = [10, 20, 30];
            const result = partitionToMultimap(input, (x) => x);

            assert.strictEqual(result.size, 3);
            assert.deepStrictEqual(result.get(10), [10]);
            assert.deepStrictEqual(result.get(20), [20]);
            assert.deepStrictEqual(result.get(30), [30]);
        });

        it("preserves the order of elements in the value arrays", () => {
            const input = [
                {id: 1, type: "A"},
                {id: 2, type: "B"},
                {id: 3, type: "A"},
                {id: 4, type: "A"},
            ];
            const result = partitionToMultimap(input, (x) => x.type);

            const groupA = result.get("A");
            assert.isDefined(groupA);
            assert.strictEqual(groupA.length, 3);

            assert.strictEqual(groupA[0]?.id, 1);
            assert.strictEqual(groupA[1]?.id, 3);
            assert.strictEqual(groupA[2]?.id, 4);
        });
    });
});

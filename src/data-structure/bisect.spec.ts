import {assert} from "chai";
import {bisectLeft, bisectRight, bisect} from "./bisect.ts";

describe("data-structure/bisect", () => {
    describe("bisectLeft", () => {
        it("should work as advertised", () => {
            assert.strictEqual(bisectLeft([1, 2, 4, 4, 6], 4), 2);
            assert.strictEqual(bisectLeft([1, 2, 4, 4, 6], 3), 2);
        });

        it("should return 0 for a target smaller than all elements", () => {
            assert.strictEqual(bisectLeft([1, 2, 3], 0), 0);
        });

        it("should return the array length for a target larger than all elements", () => {
            assert.strictEqual(bisectLeft([1, 2, 3], 5), 3);
        });

        it("should return 0 for an empty array", () => {
            assert.strictEqual(bisectLeft([], 1), 0);
        });

        it("should return the index before all equal entries", () => {
            assert.strictEqual(bisectLeft([2, 2, 2, 2], 2), 0);
        });

        it("should handle a single-element array", () => {
            assert.strictEqual(bisectLeft([5], 3), 0);
            assert.strictEqual(bisectLeft([5], 5), 0);
            assert.strictEqual(bisectLeft([5], 7), 1);
        });
    });

    describe("bisectRight", () => {
        it("should work as advertised", () => {
            assert.strictEqual(bisectRight([1, 2, 4, 4, 6], 4), 4);
            assert.strictEqual(bisectRight([1, 2, 4, 4, 6], 3), 2);
        });

        it("should return 0 for a target smaller than all elements", () => {
            assert.strictEqual(bisectRight([1, 2, 3], 0), 0);
        });

        it("should return the array length for a target larger than all elements", () => {
            assert.strictEqual(bisectRight([1, 2, 3], 5), 3);
        });

        it("should return 0 for an empty array", () => {
            assert.strictEqual(bisectRight([], 1), 0);
        });

        it("should return the index after all equal entries", () => {
            assert.strictEqual(bisectRight([2, 2, 2, 2], 2), 4);
        });

        it("should handle a single-element array", () => {
            assert.strictEqual(bisectRight([5], 3), 0);
            assert.strictEqual(bisectRight([5], 5), 1);
            assert.strictEqual(bisectRight([5], 7), 1);
        });
    });

    describe("bisect", () => {
        it("should be an alias for bisectRight", () => {
            assert.strictEqual(bisect, bisectRight);
        });
    });
});

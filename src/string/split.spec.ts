import { assert } from "chai";
import { getNextSplitLength } from "./split.ts";

describe("string/split", () => {
    describe("getNextSplitLength", () => {
        it("should work as advertised", () => {
            const text = "Hello world. This is a test.";
            assert.strictEqual(getNextSplitLength(text, 10), "Hello ".length);
            assert.strictEqual(getNextSplitLength(text, 15), "Hello world. ".length);
            assert.strictEqual(getNextSplitLength("1234567890", 5), 5);
        });

        it("should return text length if it is smaller than max_length", () => {
            assert.strictEqual(getNextSplitLength("Short", 10), 5);
        });

        it("should return 0 for empty string", () => {
            assert.strictEqual(getNextSplitLength("", 10), 0);
        });

        it("should throw RangeError if max_length is invalid", () => {
            assert.throws(() => getNextSplitLength("test", 0), RangeError);
            assert.throws(() => getNextSplitLength("test", -5), RangeError);
            assert.throws(() => getNextSplitLength("test", 10.5), RangeError);
        });

        it("should respect the order of separators", () => {
            assert.strictEqual(getNextSplitLength("AB CD.EF", 7, ['.', ' ']), 6);
        });

        it("should handle multi-character separators", () => {
            assert.strictEqual(getNextSplitLength("12345--67890", 10, ["--"]), 7);
        });

        it("should force split at max_length if no separator is found", () => {
            assert.strictEqual(getNextSplitLength("abcdefghij", 5), 5);
        });
    });
});
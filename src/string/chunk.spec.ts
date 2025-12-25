import { assert } from "chai";
import { getNextChunkLength } from "./chunk.ts";

describe("string/split", () => {
    describe("getNextChunkLength", () => {
        it("should work as advertised", () => {
            const text = "Hello world. This is a test.";
            assert.strictEqual(getNextChunkLength(text, 10), "Hello ".length);
            assert.strictEqual(getNextChunkLength(text, 15), "Hello world. ".length);
            assert.strictEqual(getNextChunkLength("1234567890", 5), 5);
        });

        it("should return text length if it is smaller than max_length", () => {
            assert.strictEqual(getNextChunkLength("Short", 10), 5);
        });

        it("should return 0 for empty string", () => {
            assert.strictEqual(getNextChunkLength("", 10), 0);
        });

        it("should throw RangeError if max_length is invalid", () => {
            assert.throws(() => getNextChunkLength("test", 0), RangeError);
            assert.throws(() => getNextChunkLength("test", -5), RangeError);
            assert.throws(() => getNextChunkLength("test", 10.5), RangeError);
        });

        it("should respect the order of separators", () => {
            assert.strictEqual(getNextChunkLength("AB CD.EF", 7, ['.', ' ']), 6);
        });

        it("should handle multi-character separators", () => {
            assert.strictEqual(getNextChunkLength("12345--67890", 10, ["--"]), 7);
        });

        it("should force split at max_length if no separator is found", () => {
            assert.strictEqual(getNextChunkLength("abcdefghij", 5), 5);
        });
    });
});
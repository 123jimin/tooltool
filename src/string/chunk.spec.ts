import { assert } from "chai";
import { chunkText, getNextChunkLength } from "./chunk.ts";

describe("string/chunk", () => {
    describe("chunkText", () => {
        it("should work as advertised", () => {
            assert.deepStrictEqual(chunkText('hello world', 5), ['hello', 'world']);
            assert.deepStrictEqual(chunkText('hello world', 7), ['hello', 'world']);
            assert.deepStrictEqual(chunkText('abcdefghij', 5), ['abcde', 'fghij']);
            assert.deepStrictEqual(chunkText('a b c d e', 4), ['a b', 'c d', 'e']);
        });

        it("should return empty array for empty string", () => {
            assert.deepStrictEqual(chunkText('', 10), []);
        });

        it("should handle text shorter than max_length", () => {
            assert.deepStrictEqual(chunkText('short', 10), ['short']);
        });

        it("should split at max_length when no separator found", () => {
            assert.deepStrictEqual(chunkText('abcdefghij', 5), ['abcde', 'fghij']);
        });

        it("should trim whitespace from chunks", () => {
            assert.deepStrictEqual(chunkText('hello   world', 8), ['hello', 'world']);
        });

        it("should skip empty chunks after trimming", () => {
            assert.deepStrictEqual(chunkText('a    b', 3), ['a', 'b']);
        });

        it("should throw RangeError for invalid max_length", () => {
            assert.throws(() => chunkText('test', 0), RangeError);
            assert.throws(() => chunkText('test', -5), RangeError);
            assert.throws(() => chunkText('test', 1.5), RangeError);
        });

        it("should split character by character when max_length is 1", () => {
            assert.deepStrictEqual(chunkText('abc', 1), ['a', 'b', 'c']);
        });

        it("should prefer higher priority separators", () => {
            assert.deepStrictEqual(chunkText('abcde.fg hi', 10, [' ', '.']), ['abcde.fg', 'hi']);
            assert.deepStrictEqual(chunkText('abcde.fg hi', 10, ['.', ' ']), ['abcde.', 'fg hi']);
        });
    });

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
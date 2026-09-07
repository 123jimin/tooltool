import {assert} from "chai";

import {chunkText, getNextChunkLength} from "./chunk.ts";

describe("string/chunk", () => {
    describe("chunkText", () => {
        it("should work as advertised", () => {
            assert.deepStrictEqual(chunkText("hello world", 5), ["hello", "world"]);
            assert.deepStrictEqual(chunkText("hello world", 7), ["hello", "world"]);
            assert.deepStrictEqual(chunkText("abcdefghij", 5), ["abcde", "fghij"]);
            assert.deepStrictEqual(chunkText("a b c d e", 4), ["a b", "c d", "e"]);
        });

        it("trims short text and the first and final chunks", () => {
            assert.deepStrictEqual(chunkText(" \tshort\n", 20), ["short"]);
            assert.deepStrictEqual(chunkText(" \tabc def  \n", 4), ["abc", "def"]);
        });

        it("skips empty input and whitespace-only chunks", () => {
            assert.deepStrictEqual(chunkText("", 2), []);
            assert.deepStrictEqual(chunkText(" \t\n\u00A0", 2), []);
            assert.deepStrictEqual(chunkText("a    b", 3), ["a", "b"]);
        });

        it("preserves surrogate pairs at forced UTF-16 boundaries", () => {
            assert.deepStrictEqual(chunkText("a\u{1D11E}bc", 2, []), ["a", "\u{1D11E}", "bc"]);
            assert.deepStrictEqual(chunkText("ab\u{1D11E}cd", 3, []), ["ab", "\u{1D11E}c", "d"]);
        });

        it("preserves non-BMP separators at the length limit", () => {
            assert.deepStrictEqual(chunkText("abc\u{1D11E}def", 5, ["\u{1D11E}"]), ["abc\u{1D11E}", "def"]);
            assert.deepStrictEqual(chunkText("ab\u{1D11E} cde", 5), ["ab\u{1D11E}", "cde"]);
        });

        it("emits whole code points and skips whitespace when the limit is one", () => {
            assert.deepStrictEqual(chunkText(" a\u{1D11E}\t\u{10437} b\n", 1), ["a", "\u{1D11E}", "\u{10437}", "b"]);
            assert.deepStrictEqual(chunkText("\u{1D11E}", 1), ["\u{1D11E}"]);
            assert.deepStrictEqual(chunkText(" \n\t", 1), []);
        });

        it("prefers higher priority separators", () => {
            assert.deepStrictEqual(chunkText("abcde.fg hi", 10, [" ", "."]), ["abcde.fg", "hi"]);
            assert.deepStrictEqual(chunkText("abcde.fg hi", 10, [".", " "]), ["abcde.", "fg hi"]);
        });

        it("rejects invalid limits even for empty text", () => {
            for(const max_length of [0, -5, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
                assert.throws(() => chunkText("", max_length), RangeError);
            }
        });
    });

    describe("getNextChunkLength", () => {
        it("should work as advertised", () => {
            assert.strictEqual(getNextChunkLength("hello world", 7), 6);
            assert.strictEqual(getNextChunkLength("abcdefghij", 5), 5);
        });

        it("returns the whole untrimmed length when text fits", () => {
            assert.strictEqual(getNextChunkLength(" a ", 3), 3);
            assert.strictEqual(getNextChunkLength("\u{1D11E}", 3), 2);
            assert.strictEqual(getNextChunkLength("", 3), 0);
        });

        it("backs off a forced split only when it would divide a surrogate pair", () => {
            assert.strictEqual(getNextChunkLength("a\u{1D11E}b", 2, []), 1);
            assert.strictEqual(getNextChunkLength("a\u{1D11E}b", 3, []), 3);
            assert.strictEqual(getNextChunkLength("a\uD834b", 2, []), 2);
        });

        it("returns two units for an initial non-BMP code point at a one-unit limit", () => {
            assert.strictEqual(getNextChunkLength("\u{1D11E}x", 1), 2);
            assert.strictEqual(getNextChunkLength("x\u{1D11E}", 1), 1);
            assert.strictEqual(getNextChunkLength("\uD834x", 1), 1);
        });

        it("uses the rightmost complete separator in the latter half", () => {
            assert.strictEqual(getNextChunkLength("ab--cd--efghi", 8, ["--"]), 8);
            assert.strictEqual(getNextChunkLength("ab--cd--efghi", 7, ["--"]), 7);
        });

        it("ignores separator ends inside a pair and finds an earlier safe occurrence", () => {
            assert.strictEqual(getNextChunkLength("abc\uD834e\u{1D11E}xyz", 7, ["\uD834"]), 4);
            assert.strictEqual(getNextChunkLength("ab\u{1D11E}cde", 5, ["\uD834"]), 5);
        });

        it("keeps empty separators from forcing an unsafe boundary", () => {
            assert.strictEqual(getNextChunkLength("a\u{1D11E}b", 2, [""]), 1);
        });

        it("rejects invalid limits even for empty text", () => {
            for(const max_length of [0, -5, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
                assert.throws(() => getNextChunkLength("", max_length), RangeError);
            }
        });
    });
});

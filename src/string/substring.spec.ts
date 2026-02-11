import {assert} from 'chai';

import {substringAfter, substringBefore, substringBetween} from "./substring.ts";

describe("string/substring", () => {
    describe("substringAfter", () => {
        it("should work as advertised", () => {
            assert.strictEqual(substringAfter("path/to/file.txt", '/'), "to/file.txt");
            assert.strictEqual(substringAfter("abc123", /\d+/), '');
            assert.strictEqual(substringAfter("abc123xyz", /\d+/), "xyz");
            assert.strictEqual(substringAfter((void 0), ':'), null);
            assert.strictEqual(substringAfter("no-needle", ':'), null);
            assert.strictEqual(substringAfter("no-needle", ':', 'default'), 'default');
            assert.strictEqual(substringAfter(null, ':', ''), '');
        });

        it("should return on_missing if delimiter is not found", () => {
            assert.strictEqual(substringAfter("abc", "d"), null);
            assert.strictEqual(substringAfter("abc", "d", "xyz"), "xyz");
            assert.strictEqual(substringAfter("abc", /d/), null);
            assert.strictEqual(substringAfter("abc", /d/, "xyz"), "xyz");
        });

        it("should return on_missing for nullish input", () => {
            assert.strictEqual(substringAfter(null, "a"), null);
            assert.strictEqual(substringAfter((void 0), "a"), null);
            assert.strictEqual(substringAfter(null, "a", "xyz"), "xyz");
            assert.strictEqual(substringAfter((void 0), "a", "xyz"), "xyz");
        });

        it("should handle empty strings", () => {
            assert.strictEqual(substringAfter("", "a"), null);
            assert.strictEqual(substringAfter("abc", ""), "abc");
            assert.strictEqual(substringAfter("", ""), "");
        });

        it("should work with regex delimiter", () => {
            assert.strictEqual(substringAfter("abc-123-xyz", /-\d+-/), "xyz");
            assert.strictEqual(substringAfter("abc-123", /-\d+/), "");
        });
    });

    describe("substringBefore", () => {
        it("should work as advertised", () => {
            assert.strictEqual(substringBefore("path/to/file.txt", '/'), "path");
            assert.strictEqual(substringBefore("abc123xyz", /\d+/), "abc");
            assert.strictEqual(substringBefore((void 0), ':'), null);
            assert.strictEqual(substringBefore("no-needle", ':'), null);
            assert.strictEqual(substringBefore("no-needle", ':', 'default'), 'default');
            assert.strictEqual(substringBefore(null, ':', ''), '');
        });

        it("should return on_missing if delimiter is not found", () => {
            assert.strictEqual(substringBefore("abc", "d"), null);
            assert.strictEqual(substringBefore("abc", "d", "xyz"), "xyz");
            assert.strictEqual(substringBefore("abc", /d/), null);
            assert.strictEqual(substringBefore("abc", /d/, "xyz"), "xyz");
        });

        it("should return on_missing for nullish input", () => {
            assert.strictEqual(substringBefore(null, "a"), null);
            assert.strictEqual(substringBefore((void 0), "a"), null);
            assert.strictEqual(substringBefore(null, "a", "xyz"), "xyz");
            assert.strictEqual(substringBefore((void 0), "a", "xyz"), "xyz");
        });

        it("should handle empty strings", () => {
            assert.strictEqual(substringBefore("", "a"), null);
            assert.strictEqual(substringBefore("abc", ""), "");
            assert.strictEqual(substringBefore("", ""), "");
        });

        it("should work with regex delimiter", () => {
            assert.strictEqual(substringBefore("abc-123-xyz", /-\d+-/), "abc");
            assert.strictEqual(substringBefore("abc-123", /-\d+/), "abc");
        });
    });

    describe("substringBetween", () => {
        it("should work as advertised", () => {
            assert.strictEqual(substringBetween("<a>b</a>", "<a>", "</a>"), "b");
            assert.strictEqual(substringBetween("<a><b></a>", "<a>", "</a>"), "<b>");
            assert.strictEqual(substringBetween("yabbadabbadoo", "abba", "doo"), "dabba");
            assert.strictEqual(substringBetween("a1b2a", "b", "a"), "2");
            assert.strictEqual(substringBetween("<a>b", "<a>", "</a>"), null);
            assert.strictEqual(substringBetween("ab</a>", "<a>", "</a>"), null);
            assert.strictEqual(substringBetween((void 0), "<a>", "</a>"), null);
            assert.strictEqual(substringBetween("<a>b</a>", "<c>", "</c>", ""), "");
        });

        it("should return on_missing if delimiters are not found", () => {
            assert.strictEqual(substringBetween("abc", "x", "y"), null);
            assert.strictEqual(substringBetween("axc", "x", "y"), null);
            assert.strictEqual(substringBetween("ayc", "x", "y"), null);
            assert.strictEqual(substringBetween("abc", "x", "y", "def"), "def");
        });

        it("should return on_missing for nullish input", () => {
            assert.strictEqual(substringBetween(null, "a", "b"), null);
            assert.strictEqual(substringBetween((void 0), "a", "b"), null);
            assert.strictEqual(substringBetween(null, "a", "b", "xyz"), "xyz");
            assert.strictEqual(substringBetween((void 0), "a", "b", "xyz"), "xyz");
        });

        it("should handle empty strings", () => {
            assert.strictEqual(substringBetween("", "a", "b"), null);
            assert.strictEqual(substringBetween("ab", "a", "b"), "");
            assert.strictEqual(substringBetween("ab", "", "b"), "a");
            assert.strictEqual(substringBetween("ab", "a", ""), "");
            assert.strictEqual(substringBetween("ab", "", ""), "");
        });

        it("should work with regex delimiters", () => {
            assert.strictEqual(substringBetween("[123]", /\[/, /\]/), "123");
            assert.strictEqual(substringBetween("<a>b</a>", /<.*?>/, /<\/.*?>/), "b");
        });

        it("should handle overlapping delimiters", () => {
            assert.strictEqual(substringBetween("abab", "a", "b"), "");
            assert.strictEqual(substringBetween("axbya", "a", "a"), "xby");
        });
    });
});

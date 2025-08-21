import { assert } from 'chai';
import { cropBefore, cropAfter, cropString } from "./crop.js";

describe("cropBefore", function() {
    it("should return null if the string is null", function() {
        assert.isNull(cropBefore(null, "a"));
        assert.isNull(cropBefore(undefined, "a"));
    });

    it("should return null if the needle is not found", function() {
        assert.isNull(cropBefore("abc", "d"));
        assert.isNull(cropBefore("abc", /d/));
    });

    it("should not modify the original string if the needle is empty (except when the end of the string is matched)", function() {
        assert.strictEqual(cropBefore("abc", ""), "abc");
        assert.strictEqual(cropBefore("abc", /^/), "abc");
        assert.strictEqual(cropBefore("abc", /$/), "");
        assert.strictEqual(cropBefore("abc", /d*/), "abc");
    });

    it("should crop a string correctly", function() {
        assert.strictEqual(cropBefore("abc", "b"), "c");
        assert.strictEqual(cropBefore("abc", /b/), "c");

        assert.strictEqual(cropBefore("Hello, world! Who are you?", "world"), "! Who are you?");
        assert.strictEqual(cropBefore("Hello, world! Who are you?", /[a-z]{5}/), "! Who are you?");
    });

    it("should crop at the first occurrence of the needle", function() {
        assert.strictEqual(cropBefore("abcabc", "b"), "cabc");
        assert.strictEqual(cropBefore("Hello, world! Who are you?", /o/), ", world! Who are you?");
    });

    it("should crop a string correctly, based on matched portion", function() {
        assert.strictEqual(cropBefore("Hello, world!", /.{3}/), "lo, world!");
        assert.strictEqual(cropBefore("The quick brown fox jumps over the lazy dog.", /o\S+\s+/), "fox jumps over the lazy dog.");
    });
});

describe("cropAfter", function() {
    it("should return null if the needle is not found", function() {
        assert.isNull(cropAfter("abc", "d"));
        assert.isNull(cropAfter("abc", /d/));
    });

    it("should return an empty string if the needle is empty (except when the end of the string is matched)", function() {
        assert.strictEqual(cropAfter("abc", ""), "");
        assert.strictEqual(cropAfter("abc", /^/), "");
        assert.strictEqual(cropAfter("abc", /$/), "abc");
        assert.strictEqual(cropAfter("abc", /d*/), "");
    });

    it("should crop a string correctly", function() {
        assert.strictEqual(cropAfter("abc", "b"), "a");
        assert.strictEqual(cropAfter("abc", /b/), "a");

        assert.strictEqual(cropAfter("Hello, world! Who are you?", "world"), "Hello, ");
        assert.strictEqual(cropAfter("Hello, world! Who are you?", /[a-z]{5}/), "Hello, ");
    });

    it("should crop at the first occurrence of the needle", function() {
        assert.strictEqual(cropAfter("abcabc", "b"), "a");
        assert.strictEqual(cropAfter("abcabc", "c"), "ab");
        assert.strictEqual(cropAfter("Hello, world! Who are you?", /o/), "Hell");
    });

    it("should crop a string correctly, based on matched portion", function() {
        assert.strictEqual(cropAfter("Hello, world!", /\s.{3}/), "Hello,");
        assert.strictEqual(cropAfter("The quick brown fox jumps over the lazy dog.", /\s+\S+o/), "The quick");
    });
});

describe("cropString", function() {
    it("should return null if the input is null or undefined", function() {
        assert.isNull(cropString(null, "a", "b"));
        assert.isNull(cropString(undefined, "a", "b"));
    });

    it("should return an empty string if the start needle is not found", function() {
        assert.isNull(cropString("Hello, world!", "x", "!"));
    });

    it("should crop a string correctly when the start and end needles are the same", function() {
        assert.strictEqual(cropString("Hello, world!", "o", "o"), ", w");
    })
});
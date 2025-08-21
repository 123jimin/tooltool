import { assert } from 'chai';
import { getRowCol } from "./debug.js";

describe("getRowCol", function() {
    it("should always return [0, 0] when the index is zero", function() {
        for(const s of [
            "",
            "abc",
            "a\nb\nc",
            "a\n\nc",
            "a\n\n\n",
            "\n\n\n",
        ]) {
            assert.deepEqual(getRowCol(s, 0), [0, 0]);
            assert.strictEqual(getRowCol(s, 0, true), "1:1");
        }
    });

    it("should return the correct row and column for a string without newlines", function() {
        for(let i=0; i<=3; ++i) {
            assert.deepEqual(getRowCol("abc", i), [0, i], `i=${i}`);
            assert.strictEqual(getRowCol("abc", i, true), `1:${i+1}`, `i=${i}, pretty=true`);
        }
    });

    it("should return the correct row and column for a newline-only string", function() {
        for(let i=0; i<=3; ++i) {
            assert.deepEqual(getRowCol("\n\n\n", i), [i, 0], `i=${i}`);
            assert.strictEqual(getRowCol("\n\n\n", i, true), `${i+1}:1`, `i=${i}, pretty=true`);
        }
    });

    it("should return the correct row and column for a string with newlines", function() {
        const s = `The quick\nbrown\n\nfox jumps\nover the lazy dog.\n`;
        let row = 0;
        let col = 0;
        for(let i=0; i<s.length; ++i) {
            assert.deepEqual(getRowCol(s, i), [row, col], `i=${i}`);
            assert.strictEqual(getRowCol(s, i, true), `${row+1}:${col+1}`, `i=${i}, pretty=true`);

            if(s[i] === '\n') {
                ++row; col = 0;
            } else {
                ++col;
            }
        }
        assert.deepEqual(getRowCol(s, s.length), [row, col], `i=${s.length}`);
        assert.strictEqual(getRowCol(s, s.length, true), `${row+1}:${col+1}`, `i=${s.length}, pretty=true`);
    });
});
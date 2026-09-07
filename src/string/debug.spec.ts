import {assert} from "chai";

import {getRowCol} from "./debug.ts";

describe("string/debug", () => {
    describe("getRowCol", () => {
        it("should work as advertised", () => {
            const text = "hello\nworld";
            assert.deepStrictEqual(getRowCol(text, 0), [0, 0]);
            assert.deepStrictEqual(getRowCol(text, 5), [0, 5]);
            assert.deepStrictEqual(getRowCol(text, 6), [1, 0]);
            assert.deepStrictEqual(getRowCol(text, 11), [1, 5]);
            assert.strictEqual(getRowCol(text, 6, true), "2:1");
        });

        it("addresses empty text and empty lines", () => {
            assert.deepStrictEqual(getRowCol("", 0), [0, 0]);
            assert.strictEqual(getRowCol("", 0, true), "1:1");
            assert.deepStrictEqual(getRowCol("a\n\nb\n", 2), [1, 0]);
            assert.deepStrictEqual(getRowCol("a\n\nb\n", 5), [3, 0]);
            assert.strictEqual(getRowCol("a\n\nb\n", 5, true), "4:1");
        });

        it("counts UTF-16 units and treats only LF as a line break", () => {
            const text = "\u{1D11E}\t\r\nx";
            assert.deepStrictEqual(getRowCol(text, 1), [0, 1]);
            assert.deepStrictEqual(getRowCol(text, 4), [0, 4]);
            assert.deepStrictEqual(getRowCol(text, 5), [1, 0]);
            assert.strictEqual(getRowCol(text, 6, true), "2:2");
        });

        it("rejects indices outside the inclusive text bounds", () => {
            assert.throws(() => getRowCol("abc", -1), RangeError);
            assert.throws(() => getRowCol("abc", 4), RangeError);
        });
    });
});

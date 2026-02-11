import {assert} from "chai";
import {trimIndented} from "./misc.ts";

describe("string/misc", () => {
    describe("trimIndented", () => {
        it("should work as advertised", () => {
            const text = `
              Hello,
                world!
            `;
            const trimmed = trimIndented(text);
            assert.strictEqual(trimmed, "Hello,\nworld!");
        });

        it("should return an empty string for an empty input", () => {
            assert.strictEqual(trimIndented(""), "");
        });

        it("should return an empty string for a whitespace-only input", () => {
            assert.strictEqual(trimIndented("   \n\t  \r\n "), "");
        });

        it("should not change a string that is already de-indented", () => {
            const text = "Hello,\nworld!";
            assert.strictEqual(trimIndented(text), text);
        });

        it("should handle mixed line endings (LF and CRLF)", () => {
            const text = "  a\r\n b\n  c";
            assert.strictEqual(trimIndented(text), "a\nb\nc");
        });

        it("should preserve empty lines between text", () => {
            const text = `
              line1

              line2
            `;
            assert.strictEqual(trimIndented(text), "line1\n\nline2");
        });

        it("should handle text with leading/trailing blank lines", () => {
            const text = `

              line1

              line2

            `;
            assert.strictEqual(trimIndented(text), "line1\n\nline2");
        });

        it("should handle text with only one line", () => {
            const text = "   Hello, world!   ";
            assert.strictEqual(trimIndented(text), "Hello, world!");
        });
    });
});

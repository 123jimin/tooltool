import {assert} from "chai";

import {dedent} from "./misc.ts";

describe("string/misc", () => {
    describe("dedent", () => {
        it("should work as advertised", () => {
            const text = `
              Hello,
                world!
            `;
            const trimmed = dedent(text);
            assert.strictEqual(trimmed, "Hello,\n  world!");
        });

        it("should return an empty string for an empty input", () => {
            assert.strictEqual(dedent(""), "");
        });

        it("should return an empty string for a whitespace-only input", () => {
            assert.strictEqual(dedent("   \n\t  \r\n "), "");
        });

        it("should not change a string that is already de-indented", () => {
            const text = "Hello,\nworld!";
            assert.strictEqual(dedent(text), text);
        });

        it("should handle mixed line endings (LF and CRLF)", () => {
            const text = "  a\r\n b\n  c";
            assert.strictEqual(dedent(text), " a\nb\n c");
        });

        it("should preserve empty lines between text", () => {
            const text = `
              line1

              line2
            `;
            assert.strictEqual(dedent(text), "line1\n\nline2");
        });

        it("normalizes whitespace-only lines regardless of common indentation", () => {
            assert.strictEqual(dedent("a\n   \t\n  b"), "a\n\n  b");
            assert.strictEqual(dedent("  a\n \t\u00A0  \n    b"), "a\n\n  b");
        });

        it("should handle text with leading/trailing blank lines", () => {
            const text = `

              line1

              line2

            `;
            assert.strictEqual(dedent(text), "line1\n\nline2");
        });

        it("should handle text with only one line", () => {
            const text = "   Hello, world!   ";
            assert.strictEqual(dedent(text), "Hello, world!   ");
        });

        it("should preserve relative indentation", () => {
            const text = `
                if(true) {
                    console.log("hello");
                }
            `;
            assert.strictEqual(dedent(text), "if(true) {\n    console.log(\"hello\");\n}");
        });
    });
});

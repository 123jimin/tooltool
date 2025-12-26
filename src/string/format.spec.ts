import { assert } from "chai";
import { formatFixedFloat, formatSignedInt } from "./format.ts";

describe("string/format", () => {
    describe("formatFixedFloat", () => {
        it("should work as advertised", () => {
            assert.strictEqual(formatFixedFloat(1234, 2), "12.34");
            assert.strictEqual(formatFixedFloat(100, 2), "1.00");
        });

        it("handles integers requiring left padding", () => {
            assert.strictEqual(formatFixedFloat(5, 2), "0.05");
            assert.strictEqual(formatFixedFloat(50, 3), "0.050");
        });

        it("handles negative numbers", () => {
            assert.strictEqual(formatFixedFloat(-1234, 2), "-12.34");
            assert.strictEqual(formatFixedFloat(-5, 2), "-0.05");
        });

        it("handles zero values", () => {
            assert.strictEqual(formatFixedFloat(0, 2), "0.00");
        });

        it("handles zero fractions", () => {
            assert.strictEqual(formatFixedFloat(1234, 0), "1234");
        });
    });

    describe("formatSignedInt", () => {
        it("should work as advertised", () => {
            assert.strictEqual(formatSignedInt(42), "+42");
            assert.strictEqual(formatSignedInt(-5), "-5");
            assert.strictEqual(formatSignedInt(0), "±0");
            assert.strictEqual(formatSignedInt(5, 3, "0"), "+005");
        });

        it("uses space as default fill string", () => {
            assert.strictEqual(formatSignedInt(5, 3), "+  5");
        });

        it("does not truncate if number length exceeds min_len", () => {
            assert.strictEqual(formatSignedInt(12345, 3, "0"), "+12345");
        });

        it("handles negative numbers with padding", () => {
            assert.strictEqual(formatSignedInt(-5, 3, "0"), "-005");
        });
    });
});
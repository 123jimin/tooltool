import { assert } from "chai";
import { identity, nop } from "./basic.js";

describe("function/basic", () => {
    describe("identity", () => {
        it("should have the correct length", () => {
            assert.strictEqual(identity.length, 1);
        });
        it("should return the original value", () => {
            for(const value of [
                0, 42, Number.POSITIVE_INFINITY, "Hello!", true, {a: 1, b: 2},
            ]) {
                assert.strictEqual(identity(value), value);
            }
        });
    });

    describe("nop", () => {
        it("should have the correct length", () => {
            assert.strictEqual(nop.length, 0);
        });

        it("should return undefined", () => {
            assert.strictEqual(nop(), (void 0));
            assert.strictEqual(nop(1, 2, 3), (void 0));
            assert.notStrictEqual(nop(), null);
        });
    });
});
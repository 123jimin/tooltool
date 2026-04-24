import {assert} from "chai";
import {identity, invoke, nop} from "./basic.ts";

describe("function/basic", () => {
    describe("identity", () => {
        it("should return the original value", () => {
            for(const value of [
                0, 42, Number.POSITIVE_INFINITY, "Hello!", true, {a: 1, b: 2},
            ]) {
                assert.strictEqual(identity(value), value);
            }
        });
    });

    describe("invoke", () => {
        it("should work as advertised", () => {
            assert.strictEqual(invoke(() => 42), 42);
        });
    });

    describe("nop", () => {
        it("should return undefined", () => {
            assert.strictEqual(nop(), (void 0));
            assert.strictEqual(nop(1, 2, 3), (void 0));
            assert.notStrictEqual(nop(), null);
        });
    });
});

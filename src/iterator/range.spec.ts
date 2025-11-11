import { assert } from "chai";
import { range } from "./range.js";

describe("iterator/range", () => {
    describe("range", () => {
        it("should return an empty generator when the only argument is 0", () => {
            assert.deepStrictEqual([...range(0)], []);
            assert.deepStrictEqual([...range(0n)], []);
        });

        it("should behave correctly when one positive argument is given", () => {
            assert.deepStrictEqual([...range(10)], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
            assert.deepStrictEqual([...range(10n)], [0n, 1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n]);
        });

        it("should behave correctly when one negative argument is given", () => {
            assert.deepStrictEqual([...range(-10)], [0, -1, -2, -3, -4, -5, -6, -7, -8, -9]);
            assert.deepStrictEqual([...range(-10n)], [0n, -1n, -2n, -3n, -4n, -5n, -6n, -7n, -8n, -9n]);
        });
    });
});
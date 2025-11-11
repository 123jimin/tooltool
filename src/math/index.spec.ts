import { assert } from "chai";
import { clamp, lerp, ceilDiv } from "./index.js";

describe("math/index", () => {
    describe("clamp", () => {
        context("number overload", () => {
            it("returns min when value is below min", () => {
                assert.strictEqual(clamp(-5, -2, 3), -2);
            });
            
            it("returns max when value is above max", () => {
                assert.strictEqual(clamp(10, -2, 3), 3);
            });
            
            it("returns value when within [min, max]", () => {
                const cases: Array<[number, number, number]> = [
                    [0, -2, 3],
                    [2, -2, 3],
                    [-1, -2, 3],
                ];
                for (const [v, min, max] of cases) {
                    assert.strictEqual(clamp(v, min, max), v, `${v} in [${min}, ${max}]`);
                }
            });
            
            it("handles boundary values", () => {
                assert.strictEqual(clamp(-2, -2, 3), -2);
                assert.strictEqual(clamp(3, -2, 3), 3);
            });
            
            it("handles equal bounds", () => {
                assert.strictEqual(clamp(42, 5, 5), 5);
                assert.strictEqual(clamp(-7, 5, 5), 5);
            });
            
            it("handles infinities and NaN", () => {
                assert.strictEqual(clamp(Number.POSITIVE_INFINITY, -1, 1), 1);
                assert.strictEqual(clamp(Number.NEGATIVE_INFINITY, -1, 1), -1);
                assert.isNaN(clamp(Number.NaN, -1, 1));
            });
        });
        
        context("bigint overload", () => {
            it("returns min when value is below min", () => {
                assert.strictEqual(clamp(-5n, -2n, 3n), -2n);
            });
            
            it("returns max when value is above max", () => {
                assert.strictEqual(clamp(10n, -2n, 3n), 3n);
            });
            
            it("returns value when within [min, max]", () => {
                const cases: Array<[bigint, bigint, bigint]> = [
                    [0n, -2n, 3n],
                    [2n, -2n, 3n],
                    [-1n, -2n, 3n],
                ];
                for (const [v, min, max] of cases) {
                    assert.strictEqual(clamp(v, min, max), v, `${v}n in [${min}n, ${max}n]`);
                }
            });
            
            it("handles boundary values", () => {
                assert.strictEqual(clamp(-2n, -2n, 3n), -2n);
                assert.strictEqual(clamp(3n, -2n, 3n), 3n);
            });
            
            it("handles equal bounds", () => {
                assert.strictEqual(clamp(42n, 5n, 5n), 5n);
                assert.strictEqual(clamp(-7n, 5n, 5n), 5n);
            });
            
            it("handles very large values", () => {
                const big = 10_000_000_000_000_000_000n;
                assert.strictEqual(clamp(big + 1n, 0n, big), big);
                assert.strictEqual(clamp(-(big + 1n), -big, 0n), -big);
                assert.strictEqual(clamp(0n, -big, big), 0n);
            });
        });
    });

    describe("lerp", () => {
        it("returns a at t = 0 and b at t = 1", () => {
            assert.strictEqual(lerp(5, 9, 0), 5);
            assert.strictEqual(lerp(5, 9, 1), 9);
        });
        
        it("returns midpoint at t = 0.5", () => {
            assert.strictEqual(lerp(0, 10, 0.5), 5);
        });
        
        it("works for negative and mixed signs", () => {
            assert.approximately(lerp(-10, 10, 0.25), -5, 1e-12);
            assert.approximately(lerp(-10, 10, 0.75), 5, 1e-12);
        });
        
        it("agrees with a + (b - a) * t across a range of t", () => {
            const a = -3.5;
            const b = 7.25;
            const ts = [-1, -0.1, 0, 0.1, 0.25, 0.4999999, 0.5, 0.9, 0.9999999, 2];
            for (const t of ts) {
                const expected = a + (b - a) * t;
                assert.approximately(lerp(a, b, t), expected, 1e-12, `t=${t}`);
            }
        });
        
        it("preserves a when a === b for all t", () => {
            for (const t of [-10, -1, 0, 0.25, 0.5, 0.9, 1, 10]) {
                assert.strictEqual(lerp(42, 42, t), 42);
            }
        });
        
        it("is numerically stable near the endpoints", () => {
            // With large, close values, the two-formula implementation should avoid
            // catastrophic cancellation near t≈0 and t≈1.
            const a = 1e16;
            const b = a + 1;
            const t1 = 1e-16;
            const t2 = 1 - 1e-16;
            
            const v1 = lerp(a, b, t1);
            const v2 = lerp(a, b, t2);
            
            // Should stay within [a, b] and be monotonic with t
            assert.isAtLeast(v1, a);
            assert.isAtMost(v1, b);
            assert.isAtLeast(v2, a);
            assert.isAtMost(v2, b);
            
            // Close to the mathematically correct values
            assert.approximately(v1, a + (b - a) * t1, 1e-6);
            assert.approximately(v2, a + (b - a) * t2, 1e-6);
        });
    });

    describe("ceilDiv", () => {
        context("number overload", () => {
            it("handles positive dividends and divisors", () => {
                assert.strictEqual(ceilDiv(10, 3), 4, "10 / 3");
                assert.strictEqual(ceilDiv(9, 3), 3, "9 / 3 (exact)");
                assert.strictEqual(ceilDiv(1, 100), 1, "1 / 100");
            });

            it("handles negative dividends", () => {
                assert.strictEqual(ceilDiv(-10, 3), -3, "-10 / 3");
                assert.strictEqual(ceilDiv(-9, 3), -3, "-9 / 3 (exact)");
            });

            it("handles negative divisors", () => {
                assert.strictEqual(ceilDiv(10, -3), -3, "10 / -3");
                assert.strictEqual(ceilDiv(9, -3), -3, "9 / -3 (exact)");
            });

            it("handles both negative dividends and divisors", () => {
                assert.strictEqual(ceilDiv(-10, -3), 4, "-10 / -3");
                assert.strictEqual(ceilDiv(-9, -3), 3, "-9 / -3 (exact)");
            });

            it("handles zero dividend", () => {
                assert.strictEqual(ceilDiv(0, 5), 0);
                assert.strictEqual(ceilDiv(0, -5), 0);
            });

            it("throws on division by zero", () => {
                assert.throws(() => ceilDiv(10, 0), RangeError, /by zero/);
            });

            it("throws on non-safe integer inputs", () => {
                assert.throws(() => ceilDiv(1.5, 1), TypeError, /safe integer/);
                assert.throws(() => ceilDiv(1, 1.5), TypeError, /safe integer/);
                assert.throws(() => ceilDiv(Number.MAX_SAFE_INTEGER + 1, 1), TypeError, /safe integer/);
            });
        });

        context("bigint overload", () => {
            it("handles positive dividends and divisors", () => {
                assert.strictEqual(ceilDiv(10n, 3n), 4n, "10n / 3n");
                assert.strictEqual(ceilDiv(9n, 3n), 3n, "9n / 3n (exact)");
                assert.strictEqual(ceilDiv(1n, 100n), 1n, "1n / 100n");
            });

            it("handles negative dividends", () => {
                assert.strictEqual(ceilDiv(-10n, 3n), -3n, "-10n / 3n");
                assert.strictEqual(ceilDiv(-9n, 3n), -3n, "-9n / 3n (exact)");
            });

            it("handles negative divisors", () => {
                assert.strictEqual(ceilDiv(10n, -3n), -3n, "10n / -3n");
                assert.strictEqual(ceilDiv(9n, -3n), -3n, "9n / -3n (exact)");
            });

            it("handles both negative dividends and divisors", () => {
                assert.strictEqual(ceilDiv(-10n, -3n), 4n, "-10n / -3n");
                assert.strictEqual(ceilDiv(-9n, -3n), 3n, "-9n / -3n (exact)");
            });

            it("handles zero dividend", () => {
                assert.strictEqual(ceilDiv(0n, 5n), 0n);
                assert.strictEqual(ceilDiv(0n, -5n), 0n);
            });

            it("throws on division by zero", () => {
                assert.throws(() => ceilDiv(10n, 0n), RangeError, /by zero/);
            });
        });

        context("type errors", () => {
            it("throws when types are mixed", () => {
                // @ts-expect-error Testing invalid types
                assert.throws(() => ceilDiv(10, 3n), TypeError, /same type/);
                // @ts-expect-error Testing invalid types
                assert.throws(() => ceilDiv(10n, 3), TypeError, /same type/);
            });
        });
    });
});
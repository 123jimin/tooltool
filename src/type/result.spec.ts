import {assert} from "chai";

import {assertEqualType} from "./index.ts";
import {
    type Err,
    isResultErr,
    isResultOk,
    type Ok,
    type Result,
    resultUnwrap,
    resultUnwrapOr,
    resultUnwrapOrElse,
} from "./result.ts";

describe("type/result", () => {
    describe("result guards", () => {
        it("should work as advertised", () => {
            const error = {code: "missing"};
            const results: Array<Result<number, typeof error>> = [
                {ok: true, value: 0},
                {ok: false, error},
            ];
            const successes = results.filter(isResultOk);
            const failures = results.filter(isResultErr);
            assertEqualType<typeof successes, Ok<number>[]>();
            assertEqualType<typeof failures, Err<typeof error>[]>();
            assert.deepEqual(successes.map((result) => result.value), [0]);
            assert.deepEqual(failures.map((result) => result.error), [error]);

            for(const result of results) {
                if(isResultOk(result)) {
                    assertEqualType<typeof result, Ok<number>>();
                } else {
                    assertEqualType<typeof result, Err<typeof error>>();
                }
                if(isResultErr(result)) {
                    assertEqualType<typeof result, Err<typeof error>>();
                } else {
                    assertEqualType<typeof result, Ok<number>>();
                }
            }
        });
    });

    describe("resultUnwrap", () => {
        it("should work as advertised", () => {
            assert.strictEqual(resultUnwrap({ok: true, value: 42}), 42);
        });

        it("throws the original failure value including non-Error and nullish values", () => {
            const errors: unknown[] = [new Error("failed"), {code: "missing"}, "failed", 0, false, null, void 0];
            for(const error of errors) {
                try {
                    resultUnwrap({ok: false, error});
                    assert.fail("Expected the failure value to be thrown");
                } catch (caught) {
                    assert.strictEqual(caught, error);
                }
            }
        });
    });

    describe("resultUnwrapOr", () => {
        it("should work as advertised", () => {
            assert.strictEqual(resultUnwrapOr({ok: true, value: 42}, 0), 42);
            assert.strictEqual(resultUnwrapOr({ok: false, error: new Error("failed")}, 0), 0);
        });

        it("retains success and heterogeneous fallback types", () => {
            const fallback: {kind: "fallback"} = {kind: "fallback"};
            const error = {code: "missing"};
            const results: Array<Result<number, typeof error>> = [
                {ok: true, value: 42},
                {ok: false, error},
            ];
            const values = results.map((result) => {
                const value = resultUnwrapOr(result, fallback);
                assertEqualType<typeof value, number|typeof fallback>();
                return value;
            });
            assert.deepEqual(values, [42, fallback]);
            assert.strictEqual(values[1], fallback);
        });
    });

    describe("resultUnwrapOrElse", () => {
        it("should work as advertised", () => {
            assert.strictEqual(resultUnwrapOrElse({ok: true, value: 42}, () => 0), 42);
            assert.strictEqual(resultUnwrapOrElse({ok: false, error: new Error("failed")}, () => -1), -1);
        });

        it("computes a fallback once with the original error and preserves inferred types", () => {
            const error = {code: "missing"};
            const fallback = {description: "unavailable"};
            const results: Array<Result<number, typeof error>> = [
                {ok: true, value: 42},
                {ok: false, error},
            ];
            let calls = 0;
            const values = results.map((result) => {
                const value = resultUnwrapOrElse(result, (caught) => {
                    assertEqualType<typeof caught, typeof error>();
                    assert.strictEqual(caught, error);
                    calls++;
                    return fallback;
                });
                assertEqualType<typeof value, number|typeof fallback>();
                return value;
            });
            assert.deepEqual(values, [42, fallback]);
            assert.strictEqual(values[1], fallback);
            assert.strictEqual(calls, 1);
        });

        it("propagates an exception thrown by the fallback unchanged", () => {
            const failure = {reason: "fallback failed"};
            try {
                resultUnwrapOrElse({ok: false, error: null}, () => { throw failure; });
                assert.fail("Expected the fallback failure to be thrown");
            } catch (caught) {
                assert.strictEqual(caught, failure);
            }
        });
    });

    it("returns falsy and nullish success values without evaluating a fallback", () => {
        const fallback = Symbol("fallback");
        let calls = 0;
        for(const value of [false, 0, "", null, void 0, Number.NaN]) {
            const result = {ok: true as const, value};
            assert.isTrue(Object.is(resultUnwrap(result), value));
            assert.isTrue(Object.is(resultUnwrapOr(result, fallback), value));
            assert.isTrue(Object.is(resultUnwrapOrElse(result, () => {
                calls++;
                return fallback;
            }), value));
        }
        assert.strictEqual(calls, 0);
    });
});

/* eslint-disable require-yield */
/* eslint-disable @stylistic/max-statements-per-line */

import {assert} from "chai";
import {runGenerator} from "./generator.ts";

describe("iterator/generator", () => {
    describe("runGenerator", () => {
        context("sync generators", () => {
            it("should work as advertised", () => {
                function* nums() { yield 1; yield 2; return 3; }
                const yielded: number[] = [];
                const result = runGenerator(nums(), (y) => yielded.push(y));
                assert.deepStrictEqual(yielded, [1, 2]);
                assert.strictEqual(result, 3);
            });

            it("should return the return value of an empty generator", () => {
                function* empty() { return 42; }
                assert.strictEqual(runGenerator(empty()), 42);
            });

            it("should not call callback for an empty generator", () => {
                function* empty() { return 0; }
                let called = false;
                runGenerator(empty(), () => { called = true; });
                assert.strictEqual(called, false);
            });

            it("should work without a callback", () => {
                function* nums() { yield 1; yield 2; return "done"; }
                assert.strictEqual(runGenerator(nums()), "done");
            });

            it("should observe yielded values in order", () => {
                function* letters() { yield "a"; yield "b"; yield "c"; return "end"; }
                const yielded: string[] = [];
                runGenerator(letters(), (y) => yielded.push(y));
                assert.deepStrictEqual(yielded, ["a", "b", "c"]);
            });

            it("should handle a generator that yields undefined", () => {
                function* gen(): Generator<undefined, string> { yield (void 0); yield (void 0); return "done"; }
                const yielded: unknown[] = [];
                const result = runGenerator(gen(), (y) => yielded.push(y));
                assert.deepStrictEqual(yielded, [(void 0), (void 0)]);
                assert.strictEqual(result, "done");
            });
        });

        context("async generators", () => {
            it("should return a promise that resolves to the return value", async () => {
                async function* nums() { yield 1; yield 2; return 3; }
                const yielded: number[] = [];
                const result = await runGenerator(nums(), (y) => yielded.push(y));
                assert.deepStrictEqual(yielded, [1, 2]);
                assert.strictEqual(result, 3);
            });

            it("should return the return value of an empty async generator", async () => {
                async function* empty() { return 42; }
                assert.strictEqual(await runGenerator(empty()), 42);
            });

            it("should work without a callback", async () => {
                async function* nums() { yield 1; yield 2; return "done"; }
                assert.strictEqual(await runGenerator(nums()), "done");
            });

            it("should observe yielded values in order", async () => {
                async function* letters() { yield "a"; yield "b"; yield "c"; return "end"; }
                const yielded: string[] = [];
                await runGenerator(letters(), (y) => yielded.push(y));
                assert.deepStrictEqual(yielded, ["a", "b", "c"]);
            });
        });
    });
});

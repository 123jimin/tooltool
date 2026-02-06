import { assert } from "chai";

import type { AsyncSink } from "./type.ts";
import { pipeToAsyncSink } from "./pipe.ts";

describe("iterator/channel/pipe", () => {
    describe("pipeToAsyncSink", () => {
        it("should work as advertised", async () => {
            const values: number[] = [];
            let completed = false;

            const sink: AsyncSink<number, void> = {
                next: (n) => { values.push(n); },
                complete: () => { completed = true; },
                error: () => { assert.fail("should not error"); },
            };

            async function* gen() {
                yield 1;
                yield 2;
                yield 3;
            }

            await pipeToAsyncSink(gen(), sink);

            assert.deepStrictEqual(values, [1, 2, 3]);
            assert.isTrue(completed);
        });

        context("with AsyncIterable source", () => {
            it("should forward all yielded values to next()", async () => {
                const values: string[] = [];

                const sink: AsyncSink<string, void> = {
                    next: (s) => { values.push(s); },
                    complete: () => {},
                    error: () => { assert.fail("should not error"); },
                };

                async function* gen() {
                    yield "a";
                    yield "b";
                    yield "c";
                }

                await pipeToAsyncSink(gen(), sink);

                assert.deepStrictEqual(values, ["a", "b", "c"]);
            });

            it("should call complete() with return value when source finishes", async () => {
                let result: string | undefined;

                const sink: AsyncSink<number, string> = {
                    next: () => {},
                    complete: (r) => { result = r; },
                    error: () => { assert.fail("should not error"); },
                };

                async function* gen(): AsyncGenerator<number, string> {
                    yield 1;
                    return "finished";
                }

                await pipeToAsyncSink(gen(), sink);

                assert.strictEqual(result, "finished");
            });

            it("should call error() when source throws", async () => {
                let caught: Error | undefined;
                const test_error = new Error("test failure");

                const sink: AsyncSink<number, void, Error> = {
                    next: () => {},
                    complete: () => { assert.fail("should not complete"); },
                    error: (err) => { caught = err; },
                };

                async function* gen() {
                    yield 1;
                    throw test_error;
                }

                await pipeToAsyncSink(gen(), sink);

                assert.strictEqual(caught, test_error);
            });

            it("should handle empty generator", async () => {
                const values: number[] = [];
                let completed = false;

                const sink: AsyncSink<number, void> = {
                    next: (n) => { values.push(n); },
                    complete: () => { completed = true; },
                    error: () => { assert.fail("should not error"); },
                };

                async function* gen(): AsyncGenerator<number, void> {
                    // yields nothing
                }

                await pipeToAsyncSink(gen(), sink);

                assert.deepStrictEqual(values, []);
                assert.isTrue(completed);
            });
        });

        context("with AsyncIterator source", () => {
            it("should consume iterator and forward values", async () => {
                const values: number[] = [];
                let completed = false;

                const sink: AsyncSink<number, void> = {
                    next: (n) => { values.push(n); },
                    complete: () => { completed = true; },
                    error: () => { assert.fail("should not error"); },
                };

                async function* gen() {
                    yield 1;
                    yield 2;
                }

                const iterator = gen()[Symbol.asyncIterator]();

                await pipeToAsyncSink(iterator, sink);

                assert.deepStrictEqual(values, [1, 2]);
                assert.isTrue(completed);
            });

            it("should forward return value from iterator", async () => {
                let result: number | undefined;

                const sink: AsyncSink<string, number> = {
                    next: () => {},
                    complete: (r) => { result = r; },
                    error: () => { assert.fail("should not error"); },
                };

                async function* gen(): AsyncGenerator<string, number> {
                    yield "x";
                    return 42;
                }

                const iterator = gen()[Symbol.asyncIterator]();

                await pipeToAsyncSink(iterator, sink);

                assert.strictEqual(result, 42);
            });
        });

        context("edge cases", () => {
            it("should handle generator that throws immediately", async () => {
                let caught: Error | undefined;
                const test_error = new Error("immediate throw");

                const sink: AsyncSink<number, void, Error> = {
                    next: () => { assert.fail("should not receive values"); },
                    complete: () => { assert.fail("should not complete"); },
                    error: (err) => { caught = err; },
                };

                // eslint-disable-next-line require-yield
                async function* gen(): AsyncGenerator<number, void> {
                    throw test_error;
                }

                await pipeToAsyncSink(gen(), sink);

                assert.strictEqual(caught, test_error);
            });

            it("should handle non-Error thrown values", async () => {
                let caught: unknown;

                const sink: AsyncSink<number, void, unknown> = {
                    next: () => {},
                    complete: () => { assert.fail("should not complete"); },
                    error: (err) => { caught = err; },
                };

                async function* gen(): AsyncGenerator<number, void> {
                    yield 1;
                    throw "string error";
                }

                await pipeToAsyncSink(gen(), sink);

                assert.strictEqual(caught, "string error");
            });

            it("should resolve after all sink methods are called", async () => {
                const call_order: string[] = [];

                const sink: AsyncSink<number, void> = {
                    next: () => { call_order.push("next"); },
                    complete: () => { call_order.push("complete"); },
                    error: () => { call_order.push("error"); },
                };

                async function* gen() {
                    yield 1;
                    yield 2;
                }

                await pipeToAsyncSink(gen(), sink);

                assert.deepStrictEqual(call_order, ["next", "next", "complete"]);
            });
        });
    });
});

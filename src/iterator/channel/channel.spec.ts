import {assert} from "chai";

import {sleep} from "../../function/basic.ts";
import {createAsyncChannel} from "./channel.ts";

describe("iterator/channel/create", () => {
    describe("createAsyncChannel", () => {
        it("should work as advertised", async () => {
            const ch = createAsyncChannel<number, string>();

            ch.next(1);
            ch.next(2);
            ch.complete("done");

            const vals: number[] = [];
            for await (const v of ch) vals.push(v);
            assert.deepStrictEqual(vals, [1, 2]);
            assert.strictEqual(await ch.result(), "done");
        });

        it("should handle async production and consumption", async () => {
            const ch = createAsyncChannel<number>();

            (async () => {
                await sleep(10);
                ch.next(1);
                await sleep(10);
                ch.next(2);
                ch.complete();
            })();

            const vals: number[] = [];
            for await (const v of ch) vals.push(v);
            assert.deepStrictEqual(vals, [1, 2]);
        });

        it("should throw errors via error()", async () => {
            const ch = createAsyncChannel<number, void, Error>();
            const err = new Error("test error");

            ch.next(1);
            ch.error(err);

            const gen = ch[Symbol.asyncIterator]();
            assert.deepStrictEqual(await gen.next(), {value: 1, done: false});

            try {
                await gen.next();
                assert.fail("should have thrown");
            } catch (e) {
                assert.strictEqual(e, err);
            }
        });

        it("should support multiple consumers", async () => {
            const ch = createAsyncChannel<number>();

            const collect = async () => {
                const vals: number[] = [];
                for await (const v of ch) vals.push(v);
                return vals;
            };

            const c1 = collect();
            const c2 = collect();

            await sleep(10);
            ch.next(1);
            ch.next(2);
            ch.complete();

            assert.deepStrictEqual(await c1, [1, 2]);
            assert.deepStrictEqual(await c2, [1, 2]);
        });

        it("should handle immediate done", async () => {
            const ch = createAsyncChannel<never, string>();
            ch.complete("immediate");

            const gen = ch[Symbol.asyncIterator]();
            assert.deepStrictEqual(await gen.next(), {value: "immediate", done: true});
        });

        it("should buffer events before consumption", async () => {
            const ch = createAsyncChannel<number>();

            ch.next(1);
            ch.next(2);
            ch.next(3);
            ch.complete();

            await sleep(10);

            const vals: number[] = [];
            for await (const v of ch) vals.push(v);
            assert.deepStrictEqual(vals, [1, 2, 3]);
        });

        it("should handle interleaved production and consumption", async () => {
            const ch = createAsyncChannel<number>();

            const consumer = (async () => {
                const vals: number[] = [];
                for await (const v of ch) {
                    vals.push(v);
                    await sleep(5);
                }
                return vals;
            })();

            await sleep(10);
            ch.next(1);
            await sleep(10);
            ch.next(2);
            await sleep(10);
            ch.next(3);
            ch.complete();

            assert.deepStrictEqual(await consumer, [1, 2, 3]);
        });

        it("should throw immediately with error", async () => {
            const ch = createAsyncChannel<number, void, Error>();
            const err = new Error("immediate failure");

            ch.error(err);

            const gen = ch[Symbol.asyncIterator]();

            try {
                await gen.next();
                assert.fail("should have thrown");
            } catch (e) {
                assert.strictEqual(e, err);
            }
        });

        it("should handle empty channel", async () => {
            const ch = createAsyncChannel<never>();
            ch.complete();

            const gen = ch[Symbol.asyncIterator]();
            const result = await gen.next();

            assert.strictEqual(result.done, true);
            assert.isUndefined(result.value);
        });

        it("should allow late consumers", async () => {
            const ch = createAsyncChannel<number>();

            ch.next(1);
            ch.next(2);

            await sleep(10);

            const consumer = (async () => {
                const vals: number[] = [];
                for await (const v of ch) vals.push(v);
                return vals;
            })();

            ch.next(3);
            ch.complete();

            assert.deepStrictEqual(await consumer, [1, 2, 3]);
        });

        it("should replay all values to each new iterator", async () => {
            const ch = createAsyncChannel<number>();

            ch.next(1);
            ch.next(2);
            ch.complete();

            const first: number[] = [];
            for await (const v of ch) first.push(v);

            const second: number[] = [];
            for await (const v of ch) second.push(v);

            assert.deepStrictEqual(first, [1, 2]);
            assert.deepStrictEqual(second, [1, 2]);
        });

        it("should return the same promise from result()", async () => {
            const ch = createAsyncChannel<number, string>();

            const p1 = ch.result();
            const p2 = ch.result();

            assert.strictEqual(p1, p2);

            ch.complete("done");

            assert.strictEqual(await p1, "done");
            assert.strictEqual(await p2, "done");
        });

        describe("subscribe", () => {
            it("should receive all events, not just the first", () => {
                const ch = createAsyncChannel<number, string>();
                const received: Array<{type: string; value: unknown}> = [];

                ch.subscribe((event) => {
                    received.push({type: event.type, value: event.value});
                });

                ch.next(1);
                ch.next(2);
                ch.next(3);
                ch.complete("done");

                assert.deepStrictEqual(received, [
                    {type: "yield", value: 1},
                    {type: "yield", value: 2},
                    {type: "yield", value: 3},
                    {type: "return", value: "done"},
                ]);
            });

            it("should flush already-buffered events immediately", () => {
                const ch = createAsyncChannel<number>();
                ch.next(1);
                ch.next(2);

                const received: number[] = [];
                ch.onYield((v) => received.push(v));

                assert.deepStrictEqual(received, [1, 2]);
            });

            it("should receive events buffered before and pushed after subscription", () => {
                const ch = createAsyncChannel<number>();
                ch.next(1);

                const received: number[] = [];
                ch.onYield((v) => received.push(v));

                ch.next(2);
                ch.next(3);
                ch.complete();

                assert.deepStrictEqual(received, [1, 2, 3]);
            });
        });

        describe("onYield", () => {
            it("should receive all yielded values", () => {
                const ch = createAsyncChannel<number>();
                const values: number[] = [];

                ch.onYield((v) => values.push(v));

                ch.next(10);
                ch.next(20);
                ch.next(30);
                ch.complete();

                assert.deepStrictEqual(values, [10, 20, 30]);
            });
        });

        describe("onReturn", () => {
            it("should receive the return value", () => {
                const ch = createAsyncChannel<number, string>();
                const returns: string[] = [];

                ch.onReturn((r) => returns.push(r));

                ch.next(1);
                ch.complete("finished");

                assert.deepStrictEqual(returns, ["finished"]);
            });
        });

        describe("onThrow", () => {
            it("should receive the thrown error", () => {
                const ch = createAsyncChannel<number, void, Error>();
                const errors: Error[] = [];
                const err = new Error("test");

                ch.onThrow((e) => errors.push(e));

                ch.next(1);
                ch.error(err);

                assert.deepStrictEqual(errors, [err]);
            });
        });
    });
});

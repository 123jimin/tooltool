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

        it("should avoid unhandled iteration-only failures while preserving late result rejection", async () => {
            const ch = createAsyncChannel<number, void, Error>();
            const err = new Error("iteration failure");
            const consumer = ch[Symbol.asyncIterator]();
            const pending = consumer.next().catch((reason: unknown) => reason);
            ch.error(err);
            assert.strictEqual(await pending, err);

            // Let the host report an unhandled rejection before attaching the late result handler.
            // The test command treats unhandled rejections as failures.
            await sleep(0);

            const result = ch.result();
            assert.strictEqual(ch.result(), result);
            assert.strictEqual(await result.catch((reason: unknown) => reason), err);
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

            it("should notify other consumers, detach faulty subscribers, and rethrow the first yield callback error", async () => {
                const ch = createAsyncChannel<number, string>();
                const first_error = new Error("first callback");
                const second_error = new Error("second callback");
                const faulty_values: number[] = [];
                const received: number[] = [];
                ch.onYield((value) => {
                    faulty_values.push(value);
                    throw first_error;
                });
                ch.onYield(() => { throw second_error; });
                ch.onYield((value) => received.push(value));

                const first_iterator = ch[Symbol.asyncIterator]();
                const second_iterator = ch[Symbol.asyncIterator]();
                const first_pending = first_iterator.next();
                const second_pending = second_iterator.next();

                assert.throws(() => ch.next(1), first_error);
                assert.deepStrictEqual(received, [1]);
                assert.deepStrictEqual(await first_pending, {value: 1, done: false});
                assert.deepStrictEqual(await second_pending, {value: 1, done: false});

                const later_pending = first_iterator.next();
                ch.next(2);
                ch.complete("done");
                assert.deepStrictEqual(await later_pending, {value: 2, done: false});
                assert.deepStrictEqual(await first_iterator.next(), {value: "done", done: true});
                assert.deepStrictEqual(await second_iterator.next(), {value: 2, done: false});
                assert.deepStrictEqual(await second_iterator.next(), {value: "done", done: true});
                assert.deepStrictEqual(faulty_values, [1]);
                assert.deepStrictEqual(received, [1, 2]);
                assert.strictEqual(await ch.result(), "done");
            });

            it("should rethrow an undefined callback exception without replacing it with a later error", async () => {
                const ch = createAsyncChannel<number, string>();
                const values: number[] = [];
                ch.onYield(() => { throw void 0; });
                ch.onYield(() => { throw new Error("later callback"); });
                ch.onYield((value) => values.push(value));

                let threw = false;
                try {
                    ch.next(1);
                } catch (err) {
                    threw = true;
                    assert.isUndefined(err);
                }
                assert.isTrue(threw);
                assert.deepStrictEqual(values, [1]);
                ch.complete("done");
                assert.strictEqual(await ch.result(), "done");
            });

            it("should settle completion and notify waiting and late consumers despite a return callback error", async () => {
                const ch = createAsyncChannel<number, string>();
                const callback_error = new Error("return callback");
                const returns: string[] = [];
                ch.onReturn(() => { throw callback_error; });
                ch.onReturn((value) => returns.push(value));
                const iterator = ch[Symbol.asyncIterator]();
                const pending = iterator.next();

                assert.throws(() => ch.complete("done"), callback_error);
                assert.deepStrictEqual(returns, ["done"]);
                assert.deepStrictEqual(await pending, {value: "done", done: true});
                assert.strictEqual(await ch.result(), "done");

                ch.onReturn((value) => returns.push(`late: ${value}`));
                assert.deepStrictEqual(returns, ["done", "late: done"]);
                assert.deepStrictEqual(await ch[Symbol.asyncIterator]().next(), {value: "done", done: true});
            });

            it("should preserve the channel error for waiting and late consumers despite a throw callback error", async () => {
                const ch = createAsyncChannel<number, void, Error>();
                const channel_error = new Error("channel failure");
                const callback_error = new Error("throw callback");
                const errors: Error[] = [];
                ch.onThrow(() => { throw callback_error; });
                ch.onThrow((value) => errors.push(value));
                const iterator = ch[Symbol.asyncIterator]();
                const pending = iterator.next().catch((reason: unknown) => reason);
                const result = ch.result().catch((reason: unknown) => reason);

                assert.throws(() => ch.error(channel_error), callback_error);
                assert.deepStrictEqual(errors, [channel_error]);
                assert.strictEqual(await pending, channel_error);
                assert.strictEqual(await result, channel_error);

                ch.onThrow((value) => errors.push(value));
                assert.deepStrictEqual(errors, [channel_error, channel_error]);
                assert.strictEqual(
                    await ch[Symbol.asyncIterator]().next().catch((reason: unknown) => reason),
                    channel_error,
                );
            });

            it("should detach a subscriber that throws during buffered replay", async () => {
                const ch = createAsyncChannel<number>();
                const callback_error = new Error("replay callback");
                const faulty_values: number[] = [];
                ch.next(1);
                assert.throws(() => ch.onYield((value) => {
                    faulty_values.push(value);
                    throw callback_error;
                }), callback_error);

                const received: number[] = [];
                ch.onYield((value) => received.push(value));
                ch.next(2);
                ch.complete();
                assert.deepStrictEqual(faulty_values, [1]);
                assert.deepStrictEqual(received, [1, 2]);
                assert.isUndefined(await ch.result());
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

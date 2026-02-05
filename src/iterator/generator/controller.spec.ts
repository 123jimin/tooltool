import { assert } from "chai";
import { createGeneratorController } from "./controller.ts";
import { sleep } from "../../function/basic.ts";

describe("iterator/generator/controller", () => {
    describe("createGeneratorController", () => {
        it("should work as advertised", async () => {
            const controller = createGeneratorController<number, string>();
            
            controller.yeet(1);
            controller.yeet(2);
            controller.done("finished");
            
            const gen = controller.entries()[Symbol.asyncIterator]()
            assert.deepStrictEqual(await gen.next(), { value: 1, done: false });
            assert.deepStrictEqual(await gen.next(), { value: 2, done: false });
            assert.deepStrictEqual(await gen.next(), { value: "finished", done: true });
        });

        it("should handle async production and consumption", async () => {
            const ctrl = createGeneratorController<number>();
            
            (async () => {
                await sleep(10);
                ctrl.yeet(1);
                await sleep(10);
                ctrl.yeet(2);
                ctrl.done();
            })();
            
            const vals: number[] = [];
            for await (const v of ctrl.entries()) vals.push(v);
            assert.deepStrictEqual(vals, [1, 2]);
        });

        it("should throw errors via fail()", async () => {
            // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
            const ctrl = createGeneratorController<number, void, Error>();
            const err = new Error("test error");
            
            ctrl.yeet(1);
            ctrl.fail(err);
            
            const gen = ctrl.entries()[Symbol.asyncIterator]()
            assert.deepStrictEqual(await gen.next(), { value: 1, done: false });
            
            try {
                await gen.next();
                assert.fail("should have thrown");
            } catch (e) {
                assert.strictEqual(e, err);
            }
        });

        it("should support multiple consumers", async () => {
            const ctrl = createGeneratorController<number>();
            
            const collect = async () => {
                const vals: number[] = [];
                for await (const v of ctrl.entries()) vals.push(v);
                return vals;
            };
            
            const c1 = collect();
            const c2 = collect();
            
            await sleep(10);
            ctrl.yeet(1);
            ctrl.yeet(2);
            ctrl.done();
            
            assert.deepStrictEqual(await c1, [1, 2]);
            assert.deepStrictEqual(await c2, [1, 2]);
        });

        it("should handle immediate done", async () => {
            const ctrl = createGeneratorController<never, string>();
            ctrl.done("immediate");
            
            const gen = ctrl.entries()[Symbol.asyncIterator]()
            assert.deepStrictEqual(await gen.next(), { value: "immediate", done: true });
        });

        it("should buffer events before consumption", async () => {
            const ctrl = createGeneratorController<number>();
            
            ctrl.yeet(1);
            ctrl.yeet(2);
            ctrl.yeet(3);
            ctrl.done();
            
            await sleep(10);
            
            const vals: number[] = [];
            for await (const v of ctrl.entries()) vals.push(v);
            assert.deepStrictEqual(vals, [1, 2, 3]);
        });

        it("should handle interleaved production and consumption", async () => {
            const ctrl = createGeneratorController<number>();
            
            const consumer = (async () => {
                const vals: number[] = [];
                for await (const v of ctrl.entries()) {
                    vals.push(v);
                    await sleep(5);
                }
                return vals;
            })();
            
            await sleep(10);
            ctrl.yeet(1);
            await sleep(10);
            ctrl.yeet(2);
            await sleep(10);
            ctrl.yeet(3);
            ctrl.done();
            
            assert.deepStrictEqual(await consumer, [1, 2, 3]);
        });

        it("should throw immediately with fail", async () => {
            // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
            const ctrl = createGeneratorController<number, void, Error>();
            const err = new Error("immediate failure");
            
            ctrl.fail(err);
            
            const gen = ctrl.entries()[Symbol.asyncIterator]()
            
            try {
                await gen.next();
                assert.fail("should have thrown");
            } catch (e) {
                assert.strictEqual(e, err);
            }
        });

        it("should handle empty generator", async () => {
            const ctrl = createGeneratorController<never>();
            ctrl.done();
            
            const gen = ctrl.entries()[Symbol.asyncIterator]()
            const result = await gen.next();
            
            assert.strictEqual(result.done, true);
            assert.isUndefined(result.value);
        });

        it("should allow late consumers", async () => {
            const ctrl = createGeneratorController<number>();
            
            ctrl.yeet(1);
            ctrl.yeet(2);
            
            await sleep(10);
            
            const consumer = (async () => {
                const vals: number[] = [];
                for await (const v of ctrl.entries()) vals.push(v);
                return vals;
            })();
            
            ctrl.yeet(3);
            ctrl.done();
            
            assert.deepStrictEqual(await consumer, [1, 2, 3]);
        });
    });
});

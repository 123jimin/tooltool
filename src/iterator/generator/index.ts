export type * from "./type.ts";
export * from "./controller.ts";

import { isAsyncIterable } from "../util.ts";

/**
 * Run a generator (sync or async) to completion, optionally observing each yielded value.
 *
 * - For a synchronous `Generator`, this returns `R`.
 * - For an `AsyncGenerator`, this returns `Promise<R>`.
 *
 * The optional `onYeet` callback is invoked for each yielded value.
 *
 * @typeParam Y - The type of yielded values.
 * @typeParam R - The type of the return value.
 *
 * @param gen - The generator to run to completion.
 * @param onYeet - Optional observer called for each truthy yielded value.
 *
 * @returns The generator's return value `R` or a `Promise<R>` for async generators.
 *
 * @example
 * // Synchronous generator
 * function* numbers() {
 *   yield 1; yield 2; return 3;
 * }
 * const result = runGenerator(numbers(), (v) => console.log("got", v));
 * // logs: "got 1", "got 2"
 * // result === 3
 *
 * @example
 * // Asynchronous generator
 * async function* asyncNumbers() {
 *   yield 1; await Promise.resolve(); yield 2; return 3;
 * }
 * const result = await runGenerator(asyncNumbers(), (v) => console.log("got", v));
 * // logs: "got 1", "got 2"
 * // result === 3
 */
export function runGenerator<Y, R>(gen: Generator<Y, R>, onYeet?: (y: Y) => void): R;
export function runGenerator<Y, R>(gen: AsyncGenerator<Y, R>, onYeet?: (y: Y) => void): Promise<R>;
export function runGenerator<Y, R>(gen: Generator<Y, R>|AsyncGenerator<Y, R>, onYeet?: (y: Y) => void): R|Promise<R> {
    if(isAsyncIterable(gen)) {
        while(true) {
            return (async(): Promise<R> => {
                while(true) {
                    const {value, done}: IteratorResult<Y, R> = await gen.next();
                    if(done) return value;
                    else onYeet?.(value);
                }
            })();
        }
    } else {
        while(true) {
            const {value, done}: IteratorResult<Y, R> = gen.next();
            if(done) return value;
            else onYeet?.(value);
        }
    }
}
export type * from "./type.ts";
export * from "./controller.ts";

import { isAsyncIterable } from "../util.ts";

/**
 * Runs a generator to completion, optionally observing each yielded value.
 *
 * @typeParam Y - Yielded value type.
 * @typeParam R - Return value type.
 * @param gen - The generator (sync or async).
 * @param onYeet - Called for each yielded value.
 * @returns The generator's return value (`R` or `Promise<R>` for async).
 *
 * @example
 * ```ts
 * function* nums() { yield 1; yield 2; return 3; }
 * runGenerator(nums(), console.log); // logs 1, 2; returns 3
 * ```
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
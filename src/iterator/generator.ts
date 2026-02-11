import {isAsyncIterable} from "./util.ts";

/** A yield event. @typeParam Y - Yielded value type. */
export type AsyncYieldEvent<Y> = {type: 'yield'; value: Y};

/** A return event. @typeParam R - Return value type. */
export type AsyncReturnEvent<R> = {type: 'return'; value: R};

/** A throw event. @typeParam T - Error type (default: `unknown`). */
export type AsyncThrowEvent<T = unknown> = {type: 'throw'; value: T};

/**
 * Union of generator events: yield, return, or throw.
 *
 * @typeParam Y - Yielded value type.
 * @typeParam R - Return value type.
 * @typeParam T - Error type (default: `unknown`).
 */
export type AsyncEvent<Y, R, T = unknown> = AsyncYieldEvent<Y> | AsyncReturnEvent<R> | AsyncThrowEvent<T>;

/**
 * Runs a generator to completion, optionally observing each yielded value.
 *
 * @typeParam Y - Yielded value type.
 * @typeParam R - Return value type.
 * @param gen - The generator (sync or async).
 * @param callback - Called for each yielded value.
 * @returns The generator's return value (`R` or `Promise<R>` for async).
 *
 * @example
 * ```ts
 * function* nums() { yield 1; yield 2; return 3; }
 * runGenerator(nums(), console.log); // logs 1, 2; returns 3
 * ```
 */
export function runGenerator<Y, R>(gen: Generator<Y, R>, callback?: (y: Y) => void): R;
export function runGenerator<Y, R>(gen: AsyncGenerator<Y, R>, callback?: (y: Y) => void): Promise<R>;
export function runGenerator<Y, R>(gen: Generator<Y, R>|AsyncGenerator<Y, R>, callback?: (y: Y) => void): R|Promise<R> {
    if(isAsyncIterable(gen)) {
        while(true) {
            return (async (): Promise<R> => {
                while(true) {
                    const {value, done}: IteratorResult<Y, R> = await gen.next();
                    if(done) return value;
                    else callback?.(value);
                }
            })();
        }
    } else {
        while(true) {
            const {value, done}: IteratorResult<Y, R> = gen.next();
            if(done) return value;
            else callback?.(value);
        }
    }
}

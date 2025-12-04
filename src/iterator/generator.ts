import { Deque } from "../data-structure/deque.ts";
import type { Nullable } from "../type/index.ts";

/**
 * Represents a yield event in an async generator execution.
 * 
 * @typeParam Y - The type of the yielded value
 * 
 * @see {@link AsyncEvent}
 * @see {@link AsyncGeneratorExecutor}
 */
export type AsyncYieldEvent<Y> = {type: 'yield'; value: Y};

/**
 * Represents a return event in an async generator execution.
 * 
 * @typeParam R - The type of the return value
 * 
 * @see {@link AsyncEvent}
 * @see {@link AsyncGeneratorExecutor}
 */
export type AsyncReturnEvent<R> = {type: 'return'; value: R};

/**
 * Represents a throw (error) event in an async generator execution.
 * 
 * @typeParam T - The type of the thrown value/error (default: `unknown`)
 * 
 * @see {@link AsyncEvent}
 * @see {@link AsyncGeneratorExecutor}
 */
export type AsyncThrowEvent<T=unknown> = {type: 'throw'; value: T};

/**
 * Union type representing all possible events in an async generator execution.
 * 
 * An event can be:
 * - A {@link AsyncYieldEvent | yield event} - producing a value
 * - A {@link AsyncReturnEvent | return event} - completing with a final value
 * - A {@link AsyncThrowEvent | throw event} - throwing an error
 * 
 * @typeParam Y - The type of yielded values
 * @typeParam R - The type of the return value
 * @typeParam T - The type of thrown values/errors (default: `unknown`)
 * 
 * @see {@link AsyncGeneratorExecutor}
 */
export type AsyncEvent<Y, R, T=unknown> = AsyncYieldEvent<Y> | AsyncReturnEvent<R> | AsyncThrowEvent<T>;

/**
 * Callback interface for controlling async generator execution.
 * 
 * Provides three methods to control the generator's behavior:
 * - {@link yeet} - Yield a value from the generator
 * - {@link done} - Complete the generator with a final return value
 * - {@link fail} - Throw an error from the generator
 * 
 * @typeParam Y - The type of yielded values
 * @typeParam R - The type of the return value
 * @typeParam T - The type of thrown values/errors (default: `unknown`)
 * 
 * @example
 * ```ts
 * const executor = (callbacks: AsyncGeneratorExecutor<number, string>) => {
 *   callbacks.yeet(1);
 *   callbacks.yeet(2);
 *   callbacks.done("completed");
 * };
 * ```
 * 
 * @see {@link toAsyncGenerator}
 */
export interface AsyncGeneratorExecutor<Y, R=void, T=unknown> {
    /**
     * Yields a value from the generator.
     * 
     * @param y - The value to yield
     */
    yeet(y: Y): void;
    
    /**
     * Completes the generator with a return value.
     * 
     * @param r - The final return value
     */
    done(r: R): void;
    
    /**
     * Throws an error from the generator.
     * 
     * @param t - The error or value to throw
     */
    fail(t: T): void;
}

/**
 * Converts a callback-based API to an async generator.
 * 
 * This function bridges imperative, callback-based APIs with async generator patterns.
 * The executor function receives callbacks ({@link AsyncGeneratorExecutor.yeet | yeet}, 
 * {@link AsyncGeneratorExecutor.done | done}, {@link AsyncGeneratorExecutor.fail | fail}) 
 * that can be called asynchronously to produce values, complete, or throw errors.
 * 
 * @typeParam Y - The type of yielded values
 * @typeParam R - The type of the return value
 * @typeParam T - The type of thrown values/errors (default: `unknown`)
 * 
 * @param executor - A function that receives {@link AsyncGeneratorExecutor | callbacks} 
 * for yielding (`yeet`), returning (`done`), and throwing (`fail`)
 * 
 * @returns An async generator that yields values as they are produced
 * 
 * @example
 * ```ts
 * // Convert a callback-based event emitter to an async generator
 * const generator = toAsyncGenerator<string, void>((callbacks) => {
 *   eventEmitter.on('data', (data) => callbacks.yeet(data));
 *   eventEmitter.on('end', () => callbacks.done());
 *   eventEmitter.on('error', (err) => callbacks.fail(err));
 * });
 * 
 * for await (const value of generator) {
 *   console.log(value);
 * }
 * ```
 * 
 * @example
 * ```ts
 * // Simple counter example
 * const counter = toAsyncGenerator<number, string>((callbacks) => {
 *   let count = 0;
 *   const interval = setInterval(() => {
 *     callbacks.yeet(count++);
 *     if (count >= 5) {
 *       clearInterval(interval);
 *       callbacks.done("finished");
 *     }
 *   }, 100);
 * });
 * ```
 * 
 * @see {@link AsyncGeneratorExecutor}
 * @see {@link runGenerator}
 */
export async function* toAsyncGenerator<Y, R=void, T=unknown>(executor: (callbacks: AsyncGeneratorExecutor<Y, R, T>) => void): AsyncGenerator<Y ,R> {
    const queue = new Deque<AsyncEvent<Y, R, T>>();

    let resolveNext: Nullable<(() => void)> = null;

    const push = (event: AsyncEvent<Y, R, T>) => {
        queue.push(event);
        if(resolveNext) {
            const localResolveNext = resolveNext;
            resolveNext = null;
            localResolveNext();
        }
    };

    try {
        executor({
            yeet(y) { push({type: 'yield', value: y}); },
            done(r) { push({type: 'return', value: r}); },
            fail(e) { push({type: 'throw', value: e}); },
        });
    } catch(err) {
        push({type: 'throw', value: err as T});
    }

    while(true) {
        if(queue.length === 0) {
            await new Promise<void>((resolve) => {
                resolveNext = resolve;
            });
        }

        while(queue.length > 0) {
            const event = queue.shift();
            if(!event) continue;

            switch(event.type) {
                case 'yield': { yield event.value; break; }
                case 'return': { return event.value; }
                case 'throw': { throw event.value; }
            }
        }
    }
}

/**
 * Type guard to check if an iterable is an async iterable.
 * 
 * Determines whether the given iterable implements the async iterator protocol
 * by checking for the presence of the `Symbol.asyncIterator` method.
 * 
 * @typeParam T - The type of values in the iterable
 * @typeParam TReturn - The type of the return value (default: `any`)
 * @typeParam TNext - The type of values that can be passed to `next()` (default: `undefined`)
 * 
 * @param it - The iterable to check
 * 
 * @returns `true` if the iterable is async, `false` otherwise
 * 
 * @example
 * ```ts
 * const syncGen = function* () { yield 1; }();
 * const asyncGen = async function* () { yield 1; }();
 * 
 * isAsyncIterable(syncGen);  // false
 * isAsyncIterable(asyncGen); // true
 * ```
 */
export function isAsyncIterable<T, TReturn, TNext>(it: Iterable<T, TReturn, TNext>|AsyncIterable<T, TReturn, TNext>): it is AsyncIterable<T, TReturn, TNext> {
    return Symbol.asyncIterator in it && (typeof it[Symbol.asyncIterator] === 'function');
}

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

import type { AsyncEvent } from './type.ts';

/**
 * Callback interface for controlling async generator execution.
 * 
 * Provides methods to control the generator's behavior:
 * - {@link yeet} - Yield a value from the generator
 * - {@link done} - Complete the generator with a final return value
 * - {@link fail} - Throw an error from the generator
 * - {@link entries} - Get the async iterable produced by this controller
 * 
 * @typeParam Y - The type of yielded values
 * @typeParam R - The type of the return value
 * @typeParam T - The type of thrown values/errors (default: `unknown`)
 * 
 * @example
 * ```ts
 * import { sleep } from '@/function/basic';
 * 
 * const controller = createController<number, string>();
 * 
 * // Produce values asynchronously
 * (async () => {
 *   await sleep(100);
 *   controller.yeet(1);
 *   await sleep(100);
 *   controller.yeet(2);
 *   await sleep(100);
 *   controller.done("completed");
 * })();
 * 
 * // Consume the values
 * for await (const value of controller.entries()) {
 *   console.log(value); // 1, then 2
 * }
 * ```
 * 
 * @see {@link toAsyncGenerator}
 */
export interface GeneratorController<Y, R=void, T=unknown> {
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
    
    /**
     * Returns the async iterable controlled by this controller.
     * 
     * This method provides access to the stream of values being produced
     * through {@link yeet}, {@link done}, and {@link fail} calls.
     * 
     * @returns An async iterable that yields values and completes with the return value
     * 
     * @example
     * ```ts
     * import { sleep } from '@/function/basic';
     * 
     * const controller = createController<number, string>();
     * 
     * // Consume values in the background
     * const consumer = (async () => {
     *   for await (const value of controller.entries()) {
     *     console.log(value); // 42, then 100
     *   }
     * })();
     * 
     * // Produce values with delays
     * await sleep(50);
     * controller.yeet(42);
     * await sleep(50);
     * controller.yeet(100);
     * controller.done("finished");
     * 
     * await consumer; // Wait for consumption to complete
     * ```
     */
    entries(): AsyncIterable<Y, R>;

    result(): Promise<R>;
}

/**
 * Creates a controller for manually controlling an async generator.
 * 
 * This function creates a controller object that allows you to imperatively
 * produce values, complete, or throw errors in an async generator stream.
 * 
 * @typeParam Y - The type of yielded values
 * @typeParam R - The type of the return value
 * @typeParam T - The type of thrown values/errors (default: `unknown`)
 * 
 * @returns A controller object implementing {@link GeneratorController}
 * 
  * @example
 * ```ts
 * import { sleep } from '@/function/basic';
 * 
 * const controller = createGeneratorController<number, string>();
 * 
 * // Start consuming in the background
 * const consumer = (async () => {
 *   const values: number[] = [];
 *   for await (const value of controller.entries()) {
 *     values.push(value);
 *   }
 *   return values;
 * })();
 * 
 * // Produce values
 * await sleep(10);
 * controller.yeet(1);
 * await sleep(10);
 * controller.yeet(2);
 * await sleep(10);
 * controller.yeet(3);
 * controller.done("finished");
 * 
 * const result = await consumer; // [1, 2, 3]
 * ```
 * 
 * @example
 * ```ts
 * // Multiple consumers receive all values
 * const controller = createGeneratorController<number>();
 * 
 * const consumer1 = (async () => {
 *   const values: number[] = [];
 *   for await (const v of controller.entries()) values.push(v);
 *   return values;
 * })();
 * 
 * const consumer2 = (async () => {
 *   const values: number[] = [];
 *   for await (const v of controller.entries()) values.push(v);
 *   return values;
 * })();
 * 
 * await sleep(10);
 * controller.yeet(1);
 * controller.yeet(2);
 * controller.done();
 * 
 * await consumer1; // [1, 2]
 * await consumer2; // [1, 2]
 * ```
 * 
 * @see {@link GeneratorController}
 * @see {@link toAsyncGenerator}
 */
export function createGeneratorController<Y, R=void, T=unknown>(): GeneratorController<Y, R, T> {
    const events: AsyncEvent<Y, R, T>[] = [];
    const waiters: (() => void)[] = [];

    let triggerResolveResult: ((result: R) => void)|null = null;
    let triggerRejectResult: ((error: T) => void)|null = null;

    const result_promise = new Promise<R>((resolve, reject) => {
        triggerResolveResult = resolve;
        triggerRejectResult = reject;
    });

    const push = (event: AsyncEvent<Y, R, T>) => {
        events.push(event);
        
        for(const waiter of waiters.splice(0)) {
            waiter();
        }

        switch(event.type) {
            case 'return':
                triggerResolveResult?.(event.value);
                return;
            case 'throw':
                triggerRejectResult?.(event.value);
                return;
        }
    };

    return {
        yeet(y: Y): void { push({type: 'yield', value: y}); },
        done(r: R): void { push({type: 'return', value: r}); },
        fail(t: T): void { push({type: 'throw', value: t}); },
        entries(): AsyncIterable<Y, R> {
            return (async function*(): AsyncGenerator<Y, R> {
                let position = 0;

                while(true) {
                    while(position < events.length) {
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        const event = events[position]!;
                        position++;

                        switch(event.type) {
                            case 'yield': { yield event.value; break; }
                            case 'return': { return event.value; }
                            case 'throw': { throw event.value; }
                        }
                    }

                    await new Promise<void>((resolve) => {
                        waiters.push(resolve);
                    });
                }
            })();
        },
        result(): Promise<R> {
            return result_promise;
        },
    };
}

// Wrapper for createGeneratorController
export async function* toAsyncGenerator<Y, R=void, T=unknown>(handleController: (controller: GeneratorController<Y, R, T>) => void): AsyncGenerator<Y, R> {
    const controller = createGeneratorController<Y, R, T>();

    try {
        handleController(controller);
    } catch(err) {
        controller.fail(err as T);
    }

    yield* controller.entries();
    return await controller.result();
}
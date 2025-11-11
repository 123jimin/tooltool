/**
 * Pauses execution for the specified duration.
 *
 * This function returns a `Promise` that resolves after the given number of
 * milliseconds. It is commonly used to introduce delays in asynchronous
 * workflows.
 *
 * @param {number} time_ms - The number of milliseconds to sleep.
 * @returns {Promise<void>} A promise that resolves once the delay has elapsed.
 *
 * @example
 * await sleep(500); // waits for 500 ms
 */
export async function sleep(time_ms: number): Promise<void> {
    return new Promise<void>((resolve) => {
        setTimeout(() => { resolve(); }, time_ms);
    });
}

/**
 * Returns the provided value unchanged.
 *
 * Useful as a default callback, placeholder function, or when working with
 * higher-order functions that require an identity mapping.
 *
 * @template T
 * @param {T} t - The value to return.
 * @returns {T} The same value that was passed in.
 *
 * @example
 * identity(42);        // 42
 * identity("hello");   // "hello"
 */
export function identity<T>(t: T): T {
    return t;
}

/**
 * A no-operation function.
 *
 * Invoking this function has no side effects and always returns `undefined`.
 * Useful as a placeholder callback or default implementation when a function
 * signature must be satisfied.
 *
 * @param {...unknown} _args - Arguments that will be ignored.
 * @returns {void}
 *
 * @example
 * nop();           // does nothing
 * nop(1, 2, 3);    // still does nothing
 * nop("a", true);  // also does nothing
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function nop(..._args: unknown[]): void {}
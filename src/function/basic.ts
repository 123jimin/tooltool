/**
 * Returns a promise that settles after a timer delay without blocking other work.
 *
 * @param time_ms - Duration in milliseconds.
 * @returns A promise that resolves after the delay.
 *
 * @remarks
 * Uses the platform's `setTimeout` directly, so delays are approximate. Many runtimes
 * support at most `2 ** 31 - 1` milliseconds per timer; larger delays can overflow
 * and resolve early. Long-duration sleeps are not currently split into safe timers.
 *
 * @example
 * ```ts
 * await sleep(500); // waits for 500 ms
 * ```
 */
export async function sleep(time_ms: number): Promise<void> {
    return new Promise<void>((resolve) => {
        setTimeout(() => { resolve(); }, time_ms);
    });
}

/**
 * Returns the provided value unchanged.
 *
 * Useful as a default callback or placeholder in higher-order functions.
 *
 * @typeParam T - The value type.
 * @param t - The value to return.
 * @returns The same value.
 *
 * @example
 * ```ts
 * identity(42);        // 42
 * identity("hello");   // "hello"
 * ```
 */
export function identity<T>(t: T): T {
    return t;
}

/**
 * Accepts any arguments and returns `undefined` without performing work.
 *
 * Useful as a placeholder callback or default implementation.
 *
 * @param args - Ignored.
 *
 * @example
 * ```ts
 * nop();           // does nothing
 * nop(1, 2, 3);    // still does nothing
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function nop(...args: unknown[]): void {}

/**
 * Invokes the provided function immediately and returns its result.
 *
 * @typeParam ReturnType - The return type of the function.
 * @param fn - The function to execute.
 * @returns The function's return value.
 *
 * @example
 * ```ts
 * const value = invoke(() => 42); // 42
 * ```
 */
export function invoke<ReturnType>(fn: () => ReturnType): ReturnType {
    return fn();
}

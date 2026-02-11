/**
 * Pauses execution for the specified duration.
 *
 * @param time_ms - Duration in milliseconds.
 * @returns A promise that resolves after the delay.
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
 * A no-operation function that accepts any arguments and returns `undefined`.
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

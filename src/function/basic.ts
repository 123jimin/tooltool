/**
 * Returns a promise that settles after a timer delay without blocking other work.
 *
 * @param time_ms - Finite duration in milliseconds; nonpositive values yield once asynchronously.
 * @returns A promise that resolves after at least the positive requested duration.
 * @throws {RangeError} If `time_ms` is not finite.
 *
 * @remarks
 * Timer scheduling is approximate and may finish late. Long waits are split into
 * timers of at most `2 ** 31 - 1` milliseconds. Remaining time is measured with
 * `performance.now()`, so late callbacks count toward the requested delay.
 *
 * @example
 * ```ts
 * await sleep(500); // waits for 500 ms
 * ```
 */
export async function sleep(time_ms: number): Promise<void> {
    if(!Number.isFinite(time_ms)) throw new RangeError("Duration must be finite");

    const started_at = performance.now();
    let remaining = Math.max(0, time_ms);
    do {
        const delay = Math.min(remaining, 2 ** 31 - 1);
        await new Promise<void>((resolve) => {
            setTimeout(resolve, delay);
        });
        remaining = time_ms - (performance.now() - started_at);
    } while(remaining > 0);
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

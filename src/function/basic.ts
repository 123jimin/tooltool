/**
 * Returns a promise that settles after a timer delay without blocking other work.
 *
 * @param time_ms - Finite duration in milliseconds; nonpositive values yield once asynchronously.
 * @returns A promise that resolves when the final timer completes.
 * @throws {RangeError} If `time_ms` is not finite.
 *
 * @remarks
 * Timer scheduling is approximate. Each iteration chooses a timer from the remaining
 * duration: up to 1000 ms waits directly and then returns without rechecking the clock;
 * up to 10000 ms waits for the remainder minus 500 ms; longer waits use 75% of the
 * remainder, capped at `2 ** 31 - 1` ms. After non-final timers, remaining time is
 * recomputed using `performance.now()`. The final short timer is trusted, including
 * any platform truncation of fractional milliseconds.
 *
 * @example
 * ```ts
 * await sleep(500); // waits approximately 500 ms
 * ```
 */
export async function sleep(time_ms: number): Promise<void> {
    if(!Number.isFinite(time_ms)) throw new RangeError("Duration must be finite");

    const started_at = performance.now();
    for(let remaining = Math.max(0, time_ms); ;) {
        const is_final_wait = remaining <= 1000;
        const delay = is_final_wait
            ? remaining
            : remaining <= 10000
                ? remaining - 500
                : Math.min(remaining * 0.75, 2 ** 31 - 1);
        await new Promise<void>((resolve) => {
            setTimeout(resolve, delay);
        });
        if(is_final_wait) break;
        remaining = time_ms - (performance.now() - started_at);
        if(remaining <= 0) break;
    }
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

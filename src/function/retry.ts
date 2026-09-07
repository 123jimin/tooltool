import {sleep} from "./basic.ts";

/**
 * Information passed to retry-related callbacks.
 */
export interface RetryInfo {
    /** Number of failed attempts so far; `0` before the initial call. */
    attempts: number;
    /** The error from the most recent failed attempt. */
    error?: unknown;
}

/**
 * An async function that can be retried.
 *
 * @typeParam T - The resolved return type.
 */
export type Retryable<T> = (info: Readonly<RetryInfo>) => Promise<T>;

/**
 * A delay function that sleeps between retry attempts.
 */
export type DelayFunction = (info: Readonly<RetryInfo>) => Promise<void>;

/**
 * A delay function that returns `true` after waiting or `false` to forfeit further retries.
 */
export type DelayFunctionWithForfeit = (info: Readonly<RetryInfo>) => Promise<boolean>;

/**
 * Retries an async function until it succeeds, using a delay function between attempts.
 *
 * @typeParam T - The resolved return type.
 * @param f - The function to retry.
 * @param doDelay - Called after each failure. If it returns `false`, retries stop and `null` is returned.
 * @returns The result of `f`, or `null` if retries were forfeited.
 * @throws Propagates errors thrown or rejected by `doDelay`; errors from `f` are retried.
 *
 * @remarks
 * `f` runs immediately with zero failures. After each rejection, `doDelay` receives
 * the incremented failure count and latest error. Only an explicit `false` forfeits.
 * Custom void-returning delays infer a nonnullable result. Boolean-returning delays,
 * including every {@link createExponentialBackoffDelay} result, infer `T | null`.
 *
 * @example
 * ```ts
 * const result = await retryWithDelay(
 *     () => fetchData(),
 *     createExponentialBackoffDelay({ init_delay: 100, max_attempts: 3 }),
 * );
 * ```
 */
export async function retryWithDelay<T>(f: Retryable<T>, doDelay: DelayFunction): Promise<T>;
export async function retryWithDelay<T>(f: Retryable<T>, doDelay: DelayFunctionWithForfeit): Promise<T|null>;
export async function retryWithDelay<T>(f: Retryable<T>, doDelay: DelayFunction|DelayFunctionWithForfeit): Promise<T|null> {
    const info: RetryInfo = {
        attempts: 0,
    };

    while(true) {
        try {
            return await f(info);
        } catch (err) {
            ++info.attempts;
            info.error = err;

            const result = await doDelay(info);
            if(result === false) return null;
        }
    }
}

/**
 * Options for exponential backoff delay.
 */
export interface ExponentialBackoffOptions {
    /** Initial delay in milliseconds. */
    init_delay: number;
    /** Maximum delay cap in milliseconds. */
    max_delay?: number;
    /** Multiplier for each successive failure's delay (default: `2`). */
    multiplier?: number;
}

/**
 * Exponential backoff options with a maximum attempt limit.
 */
export interface ExponentialBackoffOptionsWithMaxAttempts extends ExponentialBackoffOptions {
    /** Maximum total attempts, including the initial call; nonpositive values mean unlimited retries. */
    max_attempts: number;
}

/**
 * Computes the delay for a given attempt using exponential backoff.
 *
 * @param options - Backoff configuration.
 * @param attempts - Number of failures so far (1-indexed).
 * @returns Delay in milliseconds.
 *
 * @remarks
 * Computes `init_delay * multiplier ** (attempts - 1)`, capped by `max_delay` when
 * provided. Inputs are not validated; nonfinite or extreme values can produce
 * nonfinite delays, which {@link sleep} rejects.
 */
export function getDelayForExponentialBackoff(options: ExponentialBackoffOptions, attempts: number): number {
    const {init_delay, max_delay, multiplier = 2} = options;
    const delay = init_delay * Math.pow(multiplier, attempts-1);
    return (max_delay == null || delay <= max_delay) ? delay : max_delay;
}

/**
 * Creates an exponential backoff delay function for use with {@link retryWithDelay}.
 *
 * @param options - Backoff configuration. A positive `max_attempts` limits total
 *                  attempts including the initial call; reaching it forfeits without
 *                  sleeping. Omitted or nonpositive limits allow unlimited retries.
 * @returns A boolean-returning delay: `true` after waiting, `false` on forfeiture.
 *
 * @remarks
 * Delays have no jitter or cancellation. The returned delay rejects with `RangeError`
 * if its computed wait is not finite; a finite `max_delay` can cap exponential growth.
 * Finite nonpositive delays still yield asynchronously, and {@link sleep} splits
 * large finite delays into safe timer chunks.
 * Factory-based retries conservatively infer `T | null`, even without an attempt limit.
 *
 * @example
 * ```ts
 * const delay = createExponentialBackoffDelay({ init_delay: 100, max_attempts: 5 });
 * await retryWithDelay(fetchData, delay);
 * ```
 */
export function createExponentialBackoffDelay(options: ExponentialBackoffOptions | ExponentialBackoffOptionsWithMaxAttempts): DelayFunctionWithForfeit {
    if('max_attempts' in options && options.max_attempts > 0) {
        const max_attempts: number = options.max_attempts;
        return async (info) => {
            if(info.attempts >= max_attempts) return false;
            await sleep(getDelayForExponentialBackoff(options, info.attempts));
            return true;
        };
    } else {
        return async (info) => {
            await sleep(getDelayForExponentialBackoff(options, info.attempts));
            return true;
        };
    }
}

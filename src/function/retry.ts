import { sleep } from "./basic.ts";

/**
 * Information passed to retry-related callbacks.
 */
export interface RetryInfo {
    /** Number of failed attempts so far. */
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
 * A delay function that returns `false` to forfeit further retries.
 */
export type DelayFunctionWithForfeit = (info: Readonly<RetryInfo>) => Promise<boolean>;

/**
 * Retries an async function until it succeeds, using a delay function between attempts.
 *
 * @typeParam T - The resolved return type.
 * @param f - The function to retry.
 * @param doDelay - Called after each failure. If it returns `false`, retries stop and `null` is returned.
 * @returns The result of `f`, or `null` if retries were forfeited.
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
        } catch(err) {
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
    /** Multiplier for each attempt (default: `2`). */
    multiplier?: number;
}

/**
 * Exponential backoff options with a maximum attempt limit.
 */
export interface ExponentialBackoffOptionsWithMaxAttempts extends ExponentialBackoffOptions {
    /** Maximum number of retry attempts before forfeiting. */
    max_attempts: number;
}

/**
 * Computes the delay for a given attempt using exponential backoff.
 *
 * @param options - Backoff configuration.
 * @param attempts - The current attempt number (1-indexed).
 * @returns Delay in milliseconds.
 */
export function getDelayForExponentialBackoff(options: ExponentialBackoffOptions, attempts: number): number {
    const { init_delay, max_delay, multiplier = 2 } = options;
    const delay = init_delay * Math.pow(multiplier, attempts-1);
    return (max_delay == null || delay <= max_delay) ? delay : max_delay;
}

/**
 * Creates an exponential backoff delay function for use with {@link retryWithDelay}.
 *
 * @param options - Backoff configuration. If `max_attempts` is provided and positive,
 *                  returns a {@link DelayFunctionWithForfeit} that forfeits after the limit.
 *                  If `max_attempts` is 0 or negative, it's ignored and a {@link DelayFunction}
 *                  is returned (infinite retries).
 * @returns A delay function.
 *
 * @example
 * ```ts
 * const delay = createExponentialBackoffDelay({ init_delay: 100, max_attempts: 5 });
 * await retryWithDelay(fetchData, delay);
 * ```
 */
export function createExponentialBackoffDelay(options: ExponentialBackoffOptions): DelayFunction;
export function createExponentialBackoffDelay(options: ExponentialBackoffOptionsWithMaxAttempts): DelayFunctionWithForfeit;
export function createExponentialBackoffDelay(options: ExponentialBackoffOptions | ExponentialBackoffOptionsWithMaxAttempts): DelayFunction | DelayFunctionWithForfeit {
    if('max_attempts' in options && options.max_attempts > 0) {
        const max_attempts: number = options.max_attempts;
        return (async (info: RetryInfo) => {
            if(info.attempts >= max_attempts) return false;
            await sleep(getDelayForExponentialBackoff(options, info.attempts));
            return true;
        }) satisfies DelayFunctionWithForfeit;
    } else {
        return (async (info: RetryInfo) => {
            await sleep(getDelayForExponentialBackoff(options, info.attempts));
        }) satisfies DelayFunction;
    }
}
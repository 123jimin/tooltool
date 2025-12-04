import { sleep } from "./basic.ts";

export interface RetryInfo {
    attempts: number;
    error?: unknown;
}

export type Retryable<T> = (info: Readonly<RetryInfo>) => Promise<T>;

/** Delay function that sleeps for an adequate amount of time. */
export type DelayFunction = (info: Readonly<RetryInfo>) => Promise<void>;

/** Delay function, which shall return `false` if the retry should be forfeited. */
export type DelayFunctionWithForfeit = (info: Readonly<RetryInfo>) => Promise<boolean>;

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

export interface ExponentialBackoffOptions {
    init_delay: number;
    max_delay?: number;

    multiplier?: number;
}

export interface ExponentialBackoffOptionsWithMaxAttempts extends ExponentialBackoffOptions {
    max_attempts: number;
}

export function getDelayForExponentialBackoff(options: ExponentialBackoffOptions, attempts: number): number {
    const { init_delay, max_delay, multiplier = 2 } = options;
    const delay = init_delay * Math.pow(multiplier, attempts-1);
    return (max_delay == null || delay <= max_delay) ? delay : max_delay;
}

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
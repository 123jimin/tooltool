import { Deque } from "../data-structure/deque.ts";

/**
 * A function wrapper returned by {@link rateLimited} that enforces
 * a minimum delay between consecutive executions.
 *
 * @typeParam ArgsType - The tuple type of the wrapped function's parameters.
 * @typeParam ReturnType - The resolved type returned by the wrapped function.
 */
export interface RateLimitedFunction<ArgsType extends unknown[], ReturnType> {
    /**
     * Invokes the wrapped function. If the rate limit is currently active,
     * the call is queued and executed in first-come first-served order.
     *
     * @returns A promise resolving to the wrapped function's return value.
     */
    (...args: ArgsType): Promise<ReturnType>;

    /**
     * The current delay (in milliseconds) enforced between calls.
     * If a dynamic duration provider was given to {@link rateLimited},
     * this value is computed on demand.
     */
    get limit_duration_ms(): number;

    /**
     * The current number of queued, not-yet-executed calls.
     */
    get wait_count(): number;
    
    /**
     * The current number of calls being processed.
     */
    get processing_count(): number;
}

interface RateLimitedQueueItem<ArgsType extends unknown[], T> {
    args: ArgsType;
    resolve: (value: T|PromiseLike<T>) => void;
    reject: (reason?: unknown) => void;
};

/**
 * Wraps an asynchronous function so that it is executed at most once every
 * `duration_ms` milliseconds. Additional calls are queued and processed
 * sequentially following a strict FIFO (first-come first-served) order.
 *
 * This is useful when throttling API calls or expensive operations.
 *
 * @typeParam ArgsType - Parameter tuple type of the wrapped function.
 * @typeParam T - Resolved return type of the wrapped function.
 *
 * @param fn - The asynchronous function to rate-limit.
 * @param duration_ms - Either a fixed number of milliseconds, or a function
 * that returns the delay dynamically at each scheduling point.
 *
 * @returns A {@link RateLimitedFunction} instance that enforces the rate limit.
 *
 * @example
 * ```ts
 * const limitedFetch = rateLimited(fetchJson, 500);
 *
 * await limitedFetch("/endpoint"); // executes immediately
 * await limitedFetch("/endpoint"); // queued and executed ≥500ms later
 * console.log(limitedFetch.wait_count); // number of queued calls
 * ```
 */
export function rateLimited<ArgsType extends unknown[], T>(
    fn: (...args: ArgsType) => Promise<T>,
    duration_ms: number | (() => number),
): RateLimitedFunction<ArgsType, T> {
    type QueueItem = RateLimitedQueueItem<ArgsType, T>;
    const queue = new Deque<QueueItem>();

    let last_start_time: number|null = null;
    let timer: ReturnType<typeof setTimeout>|null = null;
    
    let processing_count = 0;

    const getDuration: () => number =
        typeof duration_ms === 'number' ? () => duration_ms : duration_ms;

    const processQueue = () => {
        // Only one at a time for now.
        if(processing_count > 0) return;

        const item = queue.shift();
        if(item == null) {
            timer = null;
            return;
        }

        ++processing_count;
        last_start_time = performance.now();

        Promise.resolve()
            .then(() => fn(...item.args))
            .then(item.resolve, item.reject)
            .finally(() => {
                const now = performance.now();
                const started_at = last_start_time ?? now;
                const elapsed_since_start = now - started_at;
                const remaining = Math.max(0, getDuration() - elapsed_since_start);

                --processing_count;

                if(queue.length === 0) {
                    timer = null;
                    return;
                }

                timer = setTimeout(() => {
                    timer = null;
                    processQueue();
                }, remaining);
            });
    };

    const wrappedFunction = (...args: ArgsType): Promise<T> => new Promise<T>((resolve, reject) => {
        queue.push({args, resolve, reject});
        if(processing_count === 0 && timer == null) processQueue();
    });

    Object.defineProperty(wrappedFunction, "limit_duration_ms", { enumerable: true, get: getDuration });
    Object.defineProperty(wrappedFunction, "wait_count", { enumerable: true, get: () => queue.length });
    Object.defineProperty(wrappedFunction, "processing_count", { enumerable: true, get: () => processing_count });

    return wrappedFunction as RateLimitedFunction<ArgsType, T>;
}
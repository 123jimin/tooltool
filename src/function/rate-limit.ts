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
}

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
    let last_call_time: number|null = null;
    let timer: ReturnType<typeof setTimeout>|null = null;

    type QueueItem = () => void;
    const queue: QueueItem[] = [];

    const getDuration = (): number => {
        if(typeof duration_ms === "number") return duration_ms;
        return duration_ms();
    }

    const processQueue = async() => {
        if(queue.length === 0) {
            timer = null;
            return;
        }

        last_call_time = performance.now();
        timer = setTimeout(processQueue, getDuration());
        
        const next = queue.shift();
        if(next) next();
    };

    const wrappedFunction = (...args: ArgsType): Promise<T> => new Promise<T>((resolve, reject) => {
        queue.push(() => {
            fn(...args).then(resolve).catch(reject);
        });

        if(timer != null) return;

        const now = performance.now();
        const wait = (last_call_time == null ? 0 : Math.max(0, getDuration() - (now - last_call_time)));
        timer = setTimeout(processQueue, wait);
    });

    Object.defineProperty(wrappedFunction, "limit_duration_ms", { enumerable: true, get: getDuration });
    Object.defineProperty(wrappedFunction, "wait_count", { enumerable: true, get: () => queue.length });

    return wrappedFunction as RateLimitedFunction<ArgsType, T>;
}
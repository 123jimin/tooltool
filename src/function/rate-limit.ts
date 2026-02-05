import { Deque } from "../data-structure/deque.ts";

/**
 * A function wrapper returned by {@link rateLimited} enforcing a minimum delay between calls.
 *
 * @typeParam ArgsType - Tuple of the wrapped function's parameter types.
 * @typeParam ReturnType - The resolved return type.
 */
export interface RateLimitedFunction<ArgsType extends unknown[], ReturnType> {
    /** Invokes the function; queued if rate limit is active (FIFO order). */
    (...args: ArgsType): Promise<ReturnType>;

    /** Current delay (ms) between calls. */
    get limit_duration_ms(): number;

    /** Number of queued calls awaiting execution. */
    get wait_count(): number;

    /** Number of calls currently being processed. */
    get processing_count(): number;
}

interface RateLimitedQueueItem<ArgsType extends unknown[], T> {
    args: ArgsType;
    resolve: (value: T|PromiseLike<T>) => void;
    reject: (reason?: unknown) => void;
};

/**
 * Wraps an async function to enforce a minimum delay between consecutive executions.
 *
 * Additional calls are queued and processed in FIFO order. Useful for throttling API calls.
 *
 * @typeParam ArgsType - Tuple of the function's parameter types.
 * @typeParam T - The resolved return type.
 * @param fn - The async function to rate-limit.
 * @param duration_ms - Minimum delay (ms), or a function returning the delay dynamically.
 * @returns A {@link RateLimitedFunction}.
 *
 * @example
 * ```ts
 * const limitedFetch = rateLimited(fetchJson, 500);
 * await limitedFetch("/endpoint"); // executes immediately
 * await limitedFetch("/endpoint"); // queued, executes ≥500ms later
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
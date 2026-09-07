import {Deque} from "../data-structure/deque.ts";

/**
 * A serialized function wrapper returned by {@link rateLimited} with minimum start-to-start spacing.
 *
 * @typeParam ArgsType - Tuple of the wrapped function's parameter types.
 * @typeParam ReturnType - The resolved return type.
 */
export interface RateLimitedFunction<ArgsType extends unknown[], ReturnType> {
    /** Invokes the function in FIFO order, waiting for prior work and any remaining cooldown. */
    (...args: ArgsType): Promise<ReturnType>;

    /** Current minimum start-to-start delay (ms); reading samples a dynamic duration. */
    get limit_duration_ms(): number;

    /** Number of queued calls awaiting execution. */
    get wait_count(): number;

    /** Number of active calls: `0` or `1`. */
    get processing_count(): number;
}

interface RateLimitedQueueItem<ArgsType extends unknown[], T> {
    args: ArgsType;
    resolve: (value: T|PromiseLike<T>) => void;
    reject: (reason?: unknown) => void;
};

/**
 * Serializes async calls in FIFO order with a minimum delay between their start times.
 *
 * Useful for throttling API calls without overlapping requests.
 *
 * @typeParam ArgsType - Tuple of the function's parameter types.
 * @typeParam T - The resolved return type.
 * @param fn - The async function to rate-limit.
 * @param duration_ms - Minimum delay (ms), or a function returning the delay dynamically.
 * @returns A {@link RateLimitedFunction}.
 *
 * @remarks
 * A call waits for both the previous call to settle and its start-to-start cooldown,
 * including when the queue was empty between calls. The first call has no cooldown.
 * Dynamic durations are sampled when scheduling queued work and again when a timer
 * fires, not continuously; changing the duration does not wake an existing timer early.
 * Timer precision and maximum supported delays are platform-dependent.
 *
 * @example
 * ```ts
 * const limitedFetch = rateLimited(fetchJson, 500);
 * await limitedFetch("/endpoint"); // executes immediately
 * await limitedFetch("/endpoint"); // starts ≥500ms after the previous start
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
        if(processing_count > 0 || timer != null || queue.length === 0) return;

        const now = performance.now();
        const remaining = last_start_time == null ? 0 : Math.max(0, getDuration() - (now - last_start_time));
        if(remaining > 0) {
            timer = setTimeout(() => {
                timer = null;
                processQueue();
            }, remaining);
            return;
        }

        const item = queue.shift();
        if(item == null) return;

        ++processing_count;
        last_start_time = now;

        Promise.resolve()
            .then(() => fn(...item.args))
            .then(item.resolve, item.reject)
            .finally(() => {
                --processing_count;
                processQueue();
            });
    };

    const wrappedFunction = (...args: ArgsType): Promise<T> => new Promise<T>((resolve, reject) => {
        queue.push({args, resolve, reject});
        if(processing_count === 0 && timer == null) processQueue();
    });

    Object.defineProperty(wrappedFunction, "limit_duration_ms", {enumerable: true, get: getDuration});
    Object.defineProperty(wrappedFunction, "wait_count", {enumerable: true, get: () => queue.length});
    Object.defineProperty(wrappedFunction, "processing_count", {enumerable: true, get: () => processing_count});

    return wrappedFunction as RateLimitedFunction<ArgsType, T>;
}

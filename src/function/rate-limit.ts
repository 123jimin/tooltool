export interface RateLimitedFunction<ArgsType extends unknown[], ReturnType> {
    (...args: ArgsType): Promise<ReturnType>;
    get limit_duration_ms(): number;
    get wait_count(): number;
}

/**
 * Ensure that `fn` is called at most once every `duration_ms` milliseconds, with first-come first-serve priority.
 * 
 * @param duration_ms Duration between consecutive function calls. If a function is given, then the duration is dynamically set by calling the function.
 * @param fn Function call to be rate-limited.
 * @returns Rate-limited function.
 */
export function rateLimited<ArgsType extends unknown[], T>(duration_ms: number|(() => number), fn: (...args: ArgsType) => Promise<T>): RateLimitedFunction<ArgsType, T> {
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

        last_call_time = Date.now();
        timer = setTimeout(processQueue, getDuration());
        
        const next = queue.shift();
        if(next) next();
    };

    const wrappedFunction = (...args: ArgsType): Promise<T> => new Promise<T>((resolve, reject) => {
        queue.push(() => {
            fn(...args).then(resolve).catch(reject);
        });

        if(timer != null) return;

        const now = Date.now();
        const wait = (last_call_time == null ? 0 : Math.max(0, getDuration() - (now - last_call_time)));
        timer = setTimeout(processQueue, wait);
    });

    Object.defineProperty(wrappedFunction, "limit_duration_ms", { enumerable: true, get: getDuration });
    Object.defineProperty(wrappedFunction, "wait_count", { enumerable: true, get: () => queue.length });

    return wrappedFunction as RateLimitedFunction<ArgsType, T>;
}
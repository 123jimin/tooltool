/**
 * A function wrapper returned by {@link cached} representing the wrapped function with caching capabilities.
 */
export interface CachedFunction<ArgsType extends unknown[], ReturnType> {
    /**
     * The cached function execution.
     */
    (...args: ArgsType): Promise<ReturnType>;

    /**
     * Clears the internal cache of the function.
     */
    clearCache(): void;
}


/**
 * Creates a memoized version of an asynchronous function.
 * 
 * The wrapper stores the in-flight `Promise` keyed by the provided arguments. Any
 * subsequent call with the same cache key receives the original promise, which
 * prevents duplicate work while the result is pending and after it resolves.
 * If the promise rejects, the cache entry is removed automatically so the next
 * invocation can retry.
 *
 * @param fn - The asynchronous function to memoize.
 * @param keyGenerator - Optional function to derive cache keys. When omitted,
 * `JSON.stringify(args)` is used, so prefer providing a custom key when
 * arguments contain non-serializable values.
 * @returns A cached version of the function that exposes a `.clearCache()`
 * method for manual cache invalidation.
 *
 * @example
 * const cachedFetchUser = cached(async (id: string) => fetch(`/users/${id}`).then(r => r.json()));
 * await cachedFetchUser("42"); // executes the underlying fetch
 * await cachedFetchUser("42"); // returns the cached promise
 * cachedFetchUser.clearCache(); // remove all cached entries
 */
export function cached<ArgsType extends unknown[], T, K = string>(
    fn: (...args: ArgsType) => Promise<T>,
    keyGenerator?: (...args: ArgsType) => K,
): CachedFunction<ArgsType, T> {
    const cache_map = new Map<K, Promise<T>>();

    const wrappedFunction = (...args: ArgsType): Promise<T> => {
        let key: K;

        if (keyGenerator) {
            key = keyGenerator(...args);
        } else {
            key = JSON.stringify(args) as K;
        }

        const cached_promise = cache_map.get(key);
        if(cached_promise != null) return cached_promise;

        const result_promise = fn(...args);
        cache_map.set(key, result_promise);

        result_promise.catch(() => {
            if (cache_map.get(key) === result_promise) {
                cache_map.delete(key);
            }
        });

        return result_promise;
    };

    const clearCache = (): void => {
        cache_map.clear();
    };

    Object.defineProperty(wrappedFunction, "clearCache", {
        enumerable: true,
        writable: false,
        value: clearCache,
    });
    
    return wrappedFunction as CachedFunction<ArgsType, T>;
}
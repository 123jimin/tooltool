/**
 * A function wrapper returned by {@link cached} representing the wrapped function with caching capabilities.
 */
export interface CachedFunction<ArgsType extends unknown[], ReturnType> {
    /**
     * Executes the underlying function or returns the existing in-flight/resolved promise.
     */
    (...args: ArgsType): Promise<ReturnType>;

    /**
     * Clears the internal cache of the function.
     */
    clearCache(): void;
}


/**
 * Creates a memoized version of an asynchronous function to deduplicate requests and cache results.
 *
 * The wrapper stores the `Promise` keyed by the provided arguments. Any subsequent call with the
 * same cache key receives the original promise, preventing duplicate work while the result is
 * pending (request coalescing) and after it resolves.
 *
 * If the promise rejects, the cache entry is removed immediately so the next invocation can retry.
 *
 * @param fn - The asynchronous function to memoize.
 * @param keyGenerator - Optional function to derive cache keys. When omitted, `JSON.stringify(args)`
 * is used. Provide a specific generator if arguments are complex objects or non-serializable.
 * @returns A callable object that behaves like the original function but includes a `.clearCache()` method.
 *
 * @remarks
 * Because this function evicts keys on rejection, it does not "cache failures" by default.
 * If you wish to cache a negative result (e.g., "User Not Found" to prevent repeated lookup),
 * ensure `fn` resolves with a `Result<T, E>` or `null` instead of rejecting.
 * 
 * @see {@link CachedFunction}
 *
 * @example
 * const cachedFetchUser = cached(async (id: string) => fetch(`/users/${id}`).then(r => r.json()));
 * await cachedFetchUser("42"); // executes the underlying fetch
 * await cachedFetchUser("42"); // returns the cached promise
 * cachedFetchUser.clearCache(); // remove all cached entries
 */
export function cached<ArgsType extends unknown[], T, K = unknown>(
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
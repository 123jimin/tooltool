/**
 * A function wrapper returned by {@link cached} with caching capabilities.
 *
 * @typeParam ArgsType - Tuple of the wrapped function's parameter types.
 * @typeParam ReturnType - The resolved type of the wrapped function.
 */
export interface CachedFunction<ArgsType extends unknown[], ReturnType> {
    /** Executes the function or returns the cached promise. */
    (...args: ArgsType): Promise<ReturnType>;

    /** Clears all cached entries. */
    clearCache(): void;
}

/**
 * Creates a memoized async function that deduplicates in-flight requests and caches results.
 *
 * Subsequent calls with the same cache key receive the original promise (request coalescing).
 * If the promise rejects, the entry is evicted so the next call can retry.
 *
 * @typeParam ArgsType - Tuple of the function's parameter types.
 * @typeParam T - The resolved return type.
 * @typeParam K - The cache key type.
 * @param fn - The async function to memoize.
 * @param keyGenerator - Derives a cache key from arguments. Defaults to `JSON.stringify`.
 * @returns A {@link CachedFunction} with an additional `.clearCache()` method.
 *
 * @remarks
 * Rejections are not cached. To cache negative results, resolve with `Result<T, E>` or `null`.
 *
 * @example
 * ```ts
 * const cachedFetch = cached(async (id: string) => fetch(`/users/${id}`).then(r => r.json()));
 * await cachedFetch("42"); // executes fetch
 * await cachedFetch("42"); // returns cached promise
 * cachedFetch.clearCache();
 * ```
 */
export function cached<ArgsType extends unknown[], T, K = unknown>(
    fn: (...args: ArgsType) => Promise<T>,
    keyGenerator?: (...args: ArgsType) => K,
): CachedFunction<ArgsType, T> {
    const cache_map = new Map<K, Promise<T>>();

    const wrappedFunction = (...args: ArgsType): Promise<T> => {
        let key: K;

        if(keyGenerator) {
            key = keyGenerator(...args);
        } else {
            key = JSON.stringify(args) as K;
        }

        const cached_promise = cache_map.get(key);
        if(cached_promise != null) return cached_promise;

        const result_promise = fn(...args);
        cache_map.set(key, result_promise);

        result_promise.catch(() => {
            if(cache_map.get(key) === result_promise) {
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

/**
 * Interface representing the wrapped function with caching capabilities.
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
 * Wraps an asynchronous function to cache its results based on arguments.
 *
 * @param fn - The asynchronous function to be cached.
 * @param keyGenerator - Optional function to generate cache keys.
 *                       Defaults to `JSON.stringify(args[0])` if one argument is passed,
 *                       otherwise `JSON.stringify(args)`.
 * @returns A cached version of the function with a `.clearCache()` method.
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

    Object.defineProperty(wrappedFunction, "clearCache", {
        enumerable: true,
        get: cache_map.clear.bind(cache_map),
    });
    
    return wrappedFunction as CachedFunction<ArgsType, T>;
}
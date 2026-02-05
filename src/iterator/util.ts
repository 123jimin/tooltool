/**
 * Type guard: checks if an iterable is async.
 *
 * @typeParam T - Value type.
 * @typeParam TReturn - Return type.
 * @typeParam TNext - Type passed to `next()`.
 * @param it - The iterable to check.
 * @returns `true` if async iterable.
 *
 * @example
 * ```ts
 * isAsyncIterable(function* () { yield 1; }());        // false
 * isAsyncIterable(async function* () { yield 1; }());  // true
 * ```
 */
export function isAsyncIterable<T, TReturn, TNext>(it: Iterable<T, TReturn, TNext>|AsyncIterable<T, TReturn, TNext>): it is AsyncIterable<T, TReturn, TNext> {
    return Symbol.asyncIterator in it && (typeof it[Symbol.asyncIterator] === 'function');
}
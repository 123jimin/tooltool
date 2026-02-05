/**
 * Type guard to check if an iterable is an async iterable.
 * 
 * Determines whether the given iterable implements the async iterator protocol
 * by checking for the presence of the `Symbol.asyncIterator` method.
 * 
 * @typeParam T - The type of values in the iterable
 * @typeParam TReturn - The type of the return value (default: `any`)
 * @typeParam TNext - The type of values that can be passed to `next()` (default: `undefined`)
 * 
 * @param it - The iterable to check
 * 
 * @returns `true` if the iterable is async, `false` otherwise
 * 
 * @example
 * ```ts
 * const syncGen = function* () { yield 1; }();
 * const asyncGen = async function* () { yield 1; }();
 * 
 * isAsyncIterable(syncGen);  // false
 * isAsyncIterable(asyncGen); // true
 * ```
 */
export function isAsyncIterable<T, TReturn, TNext>(it: Iterable<T, TReturn, TNext>|AsyncIterable<T, TReturn, TNext>): it is AsyncIterable<T, TReturn, TNext> {
    return Symbol.asyncIterator in it && (typeof it[Symbol.asyncIterator] === 'function');
}
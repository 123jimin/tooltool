import type { Nullable } from "../type/index.js";

/**
 * Asynchronously iterate over an array in batches.
 *
 * - If `batch_size > 0`, the array is split into consecutive batches of up to `batch_size`
 *   elements and processed sequentially.
 * - If `batch_size === 0`, the entire array is passed as a single batch (with `index = 0`).
 *
 * @template T
 * @param {T[]} arr - The array to iterate over.
 * @param {number} batch_size - Items per batch. `0` means "use the entire array as one batch".
 *   Must be a non-negative safe integer.
 * @param {(batch: T[], index: number) => Promise<void>} fn -
 *   Async callback invoked for each batch.
 *   - `batch`: A slice of `arr` (entire `arr` when `batch_size === 0`).
 *   - `index`: Starting index of `batch` within `arr` (always `0` when `batch_size === 0`).
 *
 * @returns {Promise<void>} Resolves when all batches have been processed.
 *
 * @throws {Error} If `batch_size` is negative or not a safe integer.
 *
 * @example
 * // Two-element batches
 * await batchedForEach([1,2,3,4,5], 2, async (batch, index) => {
 *   console.log(index, batch);
 * });
 */
export async function batchedForEach<T>(
    arr: T[],
    batch_size: number,
    fn: (batch: T[], index: number) => Promise<void>
): Promise<void> {
    if (batch_size < 0 || !Number.isSafeInteger(batch_size)) {
        throw new Error("batch_size must be a non-negative safe integer");
    }
    
    if (batch_size === 0) {
        await fn(arr.slice(0), 0);
        return;
    }
    
    for (let i = 0; i < arr.length; i += batch_size) {
        await fn(arr.slice(i, i + batch_size), i);
    }
}

/**
 * Asynchronously maps an array in batches and concatenates the results.
 *
 * - If `batch_size > 0`, the array is split into consecutive batches of up to `batch_size`
 *   elements and processed sequentially.
 * - If `batch_size === 0`, the entire array is passed as a single batch (with `index = 0`).
 *
 * The mapping function `fn` may return:
 * - an array of output items, which are appended to the final result, or
 * - `null` / `undefined`, which is simply treated as an empty array (`[]`).
 *
 * @template T - Type of input items.
 * @template U - Type of mapped output items.
 *
 * @param {T[]} arr - The array to map.
 * @param {number} batch_size - Items per batch. `0` means “use the entire array as one batch”.
 *   Must be a non-negative safe integer.
 * @param {(batch: T[], index: number) => Promise<Nullable<U[]>>} fn -
 *   Async mapper invoked for each batch.
 *   - `batch`: A slice of `arr` (or the entire array when `batch_size === 0`).
 *   - `index`: The starting index of `batch` within `arr`.
 *
 * @returns {Promise<U[]>} A promise resolving to a flat array containing all mapped items.
 *
 * @throws {Error} If `batch_size` is negative or not a safe integer.
 *
 * @example
 * // Normal batch mapping
 * const out = await batchedMap([1,2,3], 2, async(batch) => batch.map(x => x * 2));
 * // -> [2,4,6]
 */
export async function batchedMap<T, U>(
    arr: T[],
    batch_size: number,
    fn: (batch: T[], index: number) => Promise<Nullable<U[]>>
): Promise<U[]> {
    if (batch_size < 0 || !Number.isSafeInteger(batch_size)) {
        throw new Error("batch_size must be a non-negative safe integer");
    }
    
    const result: U[] = [];
    
    if (batch_size === 0) {
        const batch_result = await fn(arr.slice(0), 0);
        if (batch_result) result.push(...batch_result);
        return result;
    }
    
    for (let i = 0; i < arr.length; i += batch_size) {
        const batch_result = await fn(arr.slice(i, i + batch_size), i);
        if (batch_result) result.push(...batch_result);
    }
    
    return result;
}
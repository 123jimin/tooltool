import type {Nullable} from "../type/index.ts";

/**
 * Asynchronously iterates over an array in batches.
 *
 * @typeParam T - Element type.
 * @param arr - The array to iterate.
 * @param batch_size - Items per batch (`0` = entire array as one batch).
 * @param fn - Async callback `(batch, startIndex) => Promise<void>`.
 * @throws {Error} If `batch_size` is negative or not a safe integer.
 *
 * @example
 * ```ts
 * await batchedForEach([1, 2, 3, 4, 5], 2, async (batch, i) => {
 *   console.log(i, batch); // 0 [1,2], 2 [3,4], 4 [5]
 * });
 * ```
 */
export async function batchedForEach<T>(
    arr: T[],
    batch_size: number,
    fn: (batch: T[], index: number) => Promise<void>,
): Promise<void> {
    if(batch_size < 0 || !Number.isSafeInteger(batch_size)) {
        throw new Error("batch_size must be a non-negative safe integer");
    }

    if(batch_size === 0) {
        await fn(arr.slice(0), 0);
        return;
    }

    for(let i = 0; i < arr.length; i += batch_size) {
        await fn(arr.slice(i, i + batch_size), i);
    }
}

/**
 * Asynchronously maps an array in batches and concatenates results.
 *
 * @typeParam T - Input element type.
 * @typeParam U - Output element type.
 * @param arr - The array to map.
 * @param batch_size - Items per batch (`0` = entire array as one batch).
 * @param fn - Async mapper `(batch, startIndex) => Promise<U[] | null | undefined>`.
 * @returns Flattened array of all mapped items.
 * @throws {Error} If `batch_size` is negative or not a safe integer.
 *
 * @example
 * ```ts
 * await batchedMap([1, 2, 3], 2, async (b) => b.map((x) => x * 2)); // [2, 4, 6]
 * ```
 */
export async function batchedMap<T, U>(
    arr: T[],
    batch_size: number,
    fn: (batch: T[], index: number) => Promise<Nullable<U[]>>,
): Promise<U[]> {
    if(batch_size < 0 || !Number.isSafeInteger(batch_size)) {
        throw new Error("batch_size must be a non-negative safe integer");
    }

    const result: U[] = [];

    if(batch_size === 0) {
        const batch_result = await fn(arr.slice(0), 0);
        if(batch_result) result.push(...batch_result);
        return result;
    }

    for(let i = 0; i < arr.length; i += batch_size) {
        const batch_result = await fn(arr.slice(i, i + batch_size), i);
        if(batch_result) result.push(...batch_result);
    }

    return result;
}

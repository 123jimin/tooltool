import type { Nullable } from "../type/index.js";

/**
 * Iterate over an array in batches.
 * @param arr Array to iterate over.
 * @param batch_size Size of each batch.
 * @param fn Function to call for each batch. The function receives the batch and the index of the first element in the batch.
 */
export async function batchedForEach<T>(arr: T[], batch_size: number, fn: (batch: T[], index: number) => Promise<void>): Promise<void> {
    for(let i=0; i<arr.length; i += batch_size) {
        await fn(arr.slice(i, i + batch_size), i);
    }
}

/**
 * Map an array in batches.
 * @param arr Array to map.
 * @param batch_size Size of each batch.
 * @param fn Function to call for each batch.
 *  The function receives the batch and the index of the first element in the batch.
 *  The function returns the mapped batch, or `null`/`undefined` to skip the batch.
 * @returns The mapped array.
 */
export async function batchedMap<T, U>(arr: T[], batch_size: number, fn: (batch: T[], index: number) => Promise<Nullable<U[]>>): Promise<U[]> {
    const result: U[] = [];
    for(let i=0; i<arr.length; i += batch_size) {
        const batch_result = await fn(arr.slice(i, i + batch_size), i);
        if(batch_result) result.push(...batch_result);
    }
    return result;
}
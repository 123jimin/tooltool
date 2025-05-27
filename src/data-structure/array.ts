/**
 * Partition an array into two arrays based on a predicate.
 * @param arr Array to partition.
 * @param predicate Predicate function to partition by.
 * @returns A tuple of `[falsey, truthy]`, where `falsey` contains all elements for which `predicate` returned falsey, and `truthy` contains all elements for which `predicate` returned truthy.
 */
export function partition<T, U extends T>(arr: T[], predicate: (value: T, index: number, array: T[]) => value is U): [falsey: Exclude<T, U>[], truthy: U[]];
export function partition<T>(arr: T[], predicate: (value: T, index: number, array: T[]) => boolean): [falsey: T[], truthy: T[]];
export function partition<T>(arr: T[], predicate: (value: T, index: number, array: T[]) => boolean): [falsey: T[], truthy: T[]] {
    const falsey: T[] = [];
    const truthy: T[] = [];

    for(let i = 0; i < arr.length; ++i) {
        (predicate(arr[i], i, arr) ? truthy : falsey).push(arr[i]);
    }

    return [falsey, truthy];
}
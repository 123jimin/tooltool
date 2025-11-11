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

/**
 * Gets the element at the given index.
 * If the index is out of bounds, the array will be extended with shallow copies of `default_value`.
 * 
 * @param arr
 * @param index
 * @param default_value
 */
export function arrayAtOrExtend<T extends NonNullable<object>>(arr: T[], index: number, default_value: T): T {
    if(index < 0) throw new RangeError("Index must be non-negative");
    if(index < arr.length) return arr[index];

    for(let i = arr.length; i <= index; ++i) {
        arr.push({...default_value});
    }

    return arr[index];
}

/**
 * Gets the element at the given index.
 * If the index is out of bounds, the array will be extended with the result of `f(index)`.
 * 
 * @param arr 
 * @param index 
 * @param f 
 */
export function arrayAtOrExtendWith<T extends NonNullable<object>>(arr: T[], index: number, f: (index: number) => T): T {
    if(index < 0) throw new RangeError("Index must be non-negative");
    if(index < arr.length) return arr[index];

    for(let i = arr.length; i <= index; ++i) {
        arr.push(f(i));
    }

    return arr[index];
}
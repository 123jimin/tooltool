/**
 * Partitions an array into two arrays based on a predicate.
 *
 * @typeParam T - Element type.
 * @param arr - Array to partition.
 * @param predicate - Predicate function.
 * @returns `[falsey, truthy]` tuple.
 *
 * @example
 * ```ts
 * partition([1, 2, 3, 4], (n) => n % 2 === 0); // [[1, 3], [2, 4]]
 * ```
 */
export function partition<T, U extends T>(arr: T[], predicate: (value: T, index: number, array: T[]) => value is U): [falsey: Exclude<T, U>[], truthy: U[]];
export function partition<T>(arr: T[], predicate: (value: T, index: number, array: T[]) => boolean): [falsey: T[], truthy: T[]];
export function partition<T>(arr: T[], predicate: (value: T, index: number, array: T[]) => boolean): [falsey: T[], truthy: T[]] {
    const falsey: T[] = [];
    const truthy: T[] = [];

    for(let i = 0; i < arr.length; ++i) {
        (predicate(arr[i]!, i, arr) ? truthy : falsey).push(arr[i]!);
    }

    return [falsey, truthy];
}

/**
 * Gets the element at the given index, extending with shallow copies if out of bounds.
 *
 * @typeParam T - Element type.
 * @param arr - The array.
 * @param index - Non-negative index.
 * @param default_value - Template for new entries (shallow-copied).
 * @returns The element at `index`.
 * @throws {RangeError} If `index` is negative.
 */
export function arrayGetOrExtend<T extends NonNullable<object>>(arr: T[], index: number, default_value: T): T {
    if(index < 0) throw new RangeError("Index must be non-negative");
    if(index < arr.length) return arr[index]!;

    for(let i = arr.length; i <= index; ++i) {
        arr.push({...default_value});
    }

    return arr[index]!;
}

/**
 * Gets the element at the given index, extending via a factory function if out of bounds.
 *
 * @typeParam T - Element type.
 * @param arr - The array.
 * @param index - Non-negative index.
 * @param f - Factory called with index to create new entries.
 * @returns The element at `index`.
 * @throws {RangeError} If `index` is negative.
 */
export function arrayGetOrExtendWith<T extends NonNullable<object>>(arr: T[], index: number, f: (index: number) => T): T {
    if(index < 0) throw new RangeError("Index must be non-negative");
    if(index < arr.length) return arr[index]!;

    for(let i = arr.length; i <= index; ++i) {
        arr.push(f(i));
    }

    return arr[index]!;
}

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
 * @param arr - The dense array.
 * @param index - Integer array index from `0` through `2 ** 32 - 2`.
 * @param default_value - Plain record or array template for new entries.
 * @returns The element at `index`.
 * @throws {RangeError} If `index` is not a valid array index.
 * @throws {TypeError} If extension requires copying an unsupported template.
 *
 * @remarks
 * Copies array elements or enumerable own record properties, retaining nested references.
 * Templates must have this realm's `Object.prototype` or `Array.prototype`, or a null
 * prototype for records. Null-prototype records retain their null prototype. Existing
 * entries are returned without inspecting the template. Use {@link arrayGetOrExtendWith}
 * for built-ins, class instances, or templates from another realm.
 *
 * @example
 * ```ts
 * const rows: number[][] = [];
 * arrayGetOrExtend(rows, 1, [0]); // [0]; rows is [[0], [0]]
 * rows[0]!.push(1);              // rows[1] remains [0]
 * ```
 */
export function arrayGetOrExtend<T extends NonNullable<object>>(arr: T[], index: number, default_value: T): T {
    if(!Number.isInteger(index) || index < 0 || index >= 0xFFFFFFFF) {
        throw new RangeError("Index must be an integer in [0, 2 ** 32 - 2]");
    }
    if(index < arr.length) return arr[index]!;

    const is_array = Array.isArray(default_value);
    const prototype: unknown = Object.getPrototypeOf(default_value);
    if(is_array ? prototype !== Array.prototype : prototype !== Object.prototype && prototype !== null) {
        throw new TypeError("Template must be a plain record or array; use arrayGetOrExtendWith for other objects");
    }

    for(let i = arr.length; i <= index; ++i) {
        const value = is_array
            ? (default_value as unknown[]).slice()
            : prototype === null
                ? Object.assign(Object.create(null) as T, default_value)
                : {...default_value};
        arr.push(value as T);
    }

    return arr[index]!;
}

/**
 * Gets the element at the given index, extending via a factory function if out of bounds.
 *
 * @typeParam T - Element type.
 * @param arr - The dense array.
 * @param index - Integer array index from `0` through `2 ** 32 - 2`.
 * @param f - Factory called with each new index to create an entry.
 * @returns The element at `index`.
 * @throws {RangeError} If `index` is not a valid array index.
 *
 * @remarks
 * The factory is not called for an existing entry. Unlike {@link arrayGetOrExtend},
 * this accepts entries of any object type, including built-ins and class instances.
 *
 * @example
 * ```ts
 * const dates: Date[] = [];
 * arrayGetOrExtendWith(dates, 1, (i) => new Date(i)); // Date at timestamp 1
 * ```
 */
export function arrayGetOrExtendWith<T extends NonNullable<object>>(arr: T[], index: number, f: (index: number) => T): T {
    if(!Number.isInteger(index) || index < 0 || index >= 0xFFFFFFFF) {
        throw new RangeError("Index must be an integer in [0, 2 ** 32 - 2]");
    }
    if(index < arr.length) return arr[index]!;

    for(let i = arr.length; i <= index; ++i) {
        arr.push(f(i));
    }

    return arr[index]!;
}

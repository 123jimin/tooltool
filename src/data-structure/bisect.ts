/**
 * Finds the leftmost insertion point for `target` in a sorted array.
 *
 * If `target` exists, returns the index before any equal entries. (Like Python's `bisect_left`.)
 *
 * @param sorted_arr - Sorted array (ascending).
 * @param target - Value to locate.
 * @returns Insertion index.
 *
 * @remarks
 * O(log n). Behavior is undefined if array is not sorted.
 *
 * @example
 * ```ts
 * bisectLeft([1, 2, 4, 4, 6], 4); // 2
 * bisectLeft([1, 2, 4, 4, 6], 3); // 2
 * ```
 */
export function bisectLeft(sorted_arr: Array<number|bigint>, target: number): number {
    let left = 0;
    let right = sorted_arr.length;

    while(left < right) {
        const mid = Math.floor((left + right) / 2);
        if(sorted_arr[mid]! < target) {
            left = mid + 1;
        } else {
            right = mid;
        }
    }

    return left;
}

/**
 * Finds the rightmost insertion point for `target` in a sorted array.
 *
 * If `target` exists, returns the index after any equal entries. (Like Python's `bisect_right`.)
 *
 * @param sorted_arr - Sorted array (ascending).
 * @param target - Value to locate.
 * @returns Insertion index.
 *
 * @remarks
 * O(log n). Behavior is undefined if array is not sorted.
 *
 * @example
 * ```ts
 * bisectRight([1, 2, 4, 4, 6], 4); // 4
 * bisectRight([1, 2, 4, 4, 6], 3); // 2
 * ```
 */
export function bisectRight(sorted_arr: Array<number|bigint>, target: number): number {
    let left = 0;
    let right = sorted_arr.length;

    while(left < right) {
        const mid = Math.floor((left + right) / 2);
        if(sorted_arr[mid]! <= target) {
            left = mid + 1;
        } else {
            right = mid;
        }
    }

    return left;
}

/** Alias for {@link bisectRight}. */
export const bisect = bisectRight;

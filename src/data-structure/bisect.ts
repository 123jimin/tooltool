/* eslint-disable @typescript-eslint/no-non-null-assertion */

/**
 * Locates the insertion point for `target` in `sorted_arr` to maintain sorted order.
 * If `target` is already present, the insertion point is to the left of any existing entries.
 *
 * @param sorted_arr - The sorted array to search. Must be sorted in ascending order.
 * @param target - The value to locate.
 * @returns The index where `target` should be inserted.
 *
 * @remarks
 * - The time complexity is O(log n).
 * - If the array is not sorted, the result is undefined.
 * - This corresponds to Python's `bisect_left`.
 *
 * @example
 * ```ts
 * const arr = [1, 2, 4, 4, 6;
 * bisectLeft(arr, 4); // Returns 2
 * bisectLeft(arr, 3); // Returns 2
 * ```
 */
export function bisectLeft(sorted_arr: Array<number|bigint>, target: number): number {
    let left = 0;
    let right = sorted_arr.length;

    while (left < right) {
        const mid = Math.floor((left + right) / 2);
        if (sorted_arr[mid]! < target) {
            left = mid + 1;
        } else {
            right = mid;
        }
    }

    return left;
}

/**
 * Locates the insertion point for `target` in `sorted_arr` to maintain sorted order.
 * If `target` is already present, the insertion point is to the right of any existing entries.
 *
 * @param sorted_arr - The sorted array to search. Must be sorted in ascending order.
 * @param target - The value to locate.
 * @returns The index where `target` should be inserted.
 *
 * @remarks
 * - The time complexity is O(log n).
 * - If the array is not sorted, the result is undefined.
 * - This corresponds to Python's `bisect_right`.
 *
 * @example
 * ```ts
 * const arr = [1, 2, 4, 4, 6];
 * bisectRight(arr, 4); // Returns 4
 * bisectRight(arr, 3); // Returns 2
 * ```
 */
export function bisectRight(sorted_arr: Array<number|bigint>, target: number): number {
    let left = 0;
    let right = sorted_arr.length;

    while (left < right) {
        const mid = Math.floor((left + right) / 2);
        if (sorted_arr[mid]! <= target) {
            left = mid + 1;
        } else {
            right = mid;
        }
    }

    return left;
}

export const bisect = bisectRight;
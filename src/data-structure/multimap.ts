/**
 * Adds a value to the array for a key in a `Map`-backed multimap.
 *
 * Creates the array if the key doesn't exist.
 *
 * @typeParam K - Key type.
 * @typeParam V - Value type.
 * @param m - The multimap.
 * @param k - The key.
 * @param v - The value to add.
 * @returns The array for key `k` (same reference).
 *
 * @example
 * ```ts
 * const mm = new Map<string, number[]>();
 * multimapAdd(mm, "a", 1);
 * multimapAdd(mm, "a", 2);
 * mm.get("a"); // [1, 2]
 * ```
 */
export function multimapAdd<K, V>(m: Map<K, V[]>, k: K, v: V): V[];

/**
 * Adds a value to the array for a key in a `Record`-backed multimap.
 *
 * Creates the array if the key doesn't exist.
 *
 * @typeParam K - Key type (must be `PropertyKey`).
 * @typeParam V - Value type.
 * @param m - The multimap.
 * @param k - The key.
 * @param v - The value to add.
 * @returns The array for key `k` (same reference).
 */
export function multimapAdd<K extends PropertyKey, V>(m: Record<K, V[]>, k: K, v: V): V[];

export function multimapAdd<K extends PropertyKey, V>(
    m: Map<K, V[]> | Record<K, V[]>,
    k: K,
    v: V,
): V[] {
    if (m instanceof Map) {
        const arr = m.get(k) ?? [];
        if (arr.length === 0) m.set(k, arr);
        arr.push(v);
        return arr;
    } else {
        const arr = m[k] ?? [];
        if (arr.length === 0) m[k] = arr;
        arr.push(v);
        return arr;
    }
}

/**
 * Partitions an array into a `Map`-based multimap using a key extractor.
 *
 * @typeParam T - Element type.
 * @typeParam U - Key type.
 * @param arr - The array to partition.
 * @param key - Extracts a key from each element.
 * @returns A `Map` grouping elements by key.
 *
 * @example
 * ```ts
 * const nums = [1, 2, 3, 4, 5];
 * const parity = partitionToMultimap(nums, (n) => n % 2 === 0 ? "even" : "odd");
 * parity.get("odd");  // [1, 3, 5]
 * parity.get("even"); // [2, 4]
 * ```
 */
export function partitionToMultimap<T, U>(arr: T[], key: (t: T) => U): Map<U, T[]> {
    const map = new Map<U, T[]>();

    for (const item of arr) {
        multimapAdd(map, key(item), item);
    }

    return map;
}
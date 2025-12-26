/**
 * Adds a value `v` to the array associated with key `k` inside a `Map`-backed multimap.
 *
 * If the key does not yet exist in the map, a new array is created, added to the map,
 * and then the value is appended. If the key already exists, the value is appended to
 * the existing array.
 *
 * @typeParam K The type of keys in the map.
 * @typeParam V The type of values stored in the multimap.
 *
 * @param m - A `Map` where each key maps to an array of values.
 * @param k - The key under which the value should be inserted.
 * @param v - The value to add to the key's array.
 *
 * @returns The array associated with key `k` after insertion.
 *
 * @example
 * const mm = new Map<string, number[]>();
 * multimapAdd(mm, "a", 1);
 * multimapAdd(mm, "a", 2);
 * console.log(mm.get("a"));
 * // → [1, 2]
 *
 * @example
 * const mm = new Map<number, boolean[]>();
 * const arr = multimapAdd(mm, 42, true);
 * console.log(arr);
 * // → [true]
 * console.log(mm.get(42) === arr);
 * // → true (same reference)
 */
export function multimapAdd<K, V>(m: Map<K, V[]>, k: K, v: V): V[];

/**
 * Adds a value `v` to the array associated with key `k` inside a `Record`-backed multimap.
 *
 * If the key does not yet exist in the record, a new array is created, added to the record,
 * and then the value is appended. If the key already exists, the value is appended to
 * the existing array.
 *
 * @typeParam K The type of keys in the record (must extend `PropertyKey`).
 * @typeParam V The type of values stored in the multimap.
 *
 * @param m - A `Record` where each key maps to an array of values.
 * @param k - The key under which the value should be inserted.
 * @param v - The value to add to the key's array.
 *
 * @returns The array associated with key `k` after insertion.
 *
 * @example
 * const mm: Record<string, string[]> = {};
 * multimapAdd(mm, "fruits", "apple");
 * multimapAdd(mm, "fruits", "banana");
 * multimapAdd(mm, "vegetables", "carrot");
 *
 * console.log(mm["fruits"]);
 * // → ["apple", "banana"]
 * console.log(mm["vegetables"]);
 * // → ["carrot"]
 *
 * @example
 * const mm: Record<number, boolean[]> = {};
 * const arr = multimapAdd(mm, 42, true);
 * console.log(arr);
 * // → [true]
 * console.log(mm[42] === arr);
 * // → true (same reference)
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
 * Partitions an array into a `Map`-based multimap using a key extractor function.
 *
 * Each element in the array is mapped to a key via the provided function.
 * The result is a `Map` where each key holds an array of all elements that produced that key.
 *
 * @typeParam T - The type of elements in the input array.
 * @typeParam U - The type of keys in the resulting map.
 *
 * @param arr - The array of elements to partition.
 * @param key - A function that produces a key from an element.
 *
 * @returns A `Map` grouping elements by their extracted keys.
 *
 * @example
 * const numbers = [1, 2, 3, 4, 5];
 * const parity = partitionToMultimap(numbers, (n) => n % 2 === 0 ? "even" : "odd");
 *
 * console.log(parity.get("odd"));
 * // → [1, 3, 5]
 * console.log(parity.get("even"));
 * // → [2, 4]
 *
 * @example
 * const words = ["apple", "banana", "avocado", "cherry"];
 * const byFirstChar = partitionToMultimap(words, (w) => w[0]);
 *
 * console.log(byFirstChar.get("a"));
 * // → ["apple", "avocado"]
 */
export function partitionToMultimap<T, U>(arr: T[], key: (t: T) => U): Map<U, T[]> {
    const map = new Map<U, T[]>();

    for (const item of arr) {
        multimapAdd(map, key(item), item);
    }

    return map;
}
/**
 * Adds a value `v` to the array associated with key `k` inside a `Map`-backed multimap.
 *
 * If the key does not yet exist in the map, a new array is created, added to the map,
 * and then the value is appended. If the key already exists, the value is appended to
 * the existing array.
 * 
 * @template K The type of keys in the map.
 * @template V The type of values stored in the multimap.
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
 * const mm = new Map<string, string[]>();
 * multimapAdd(mm, "fruits", "apple");
 * multimapAdd(mm, "fruits", "banana");
 * multimapAdd(mm, "vegetables", "carrot");
 *
 * console.log(mm.get("fruits"));     
 * // → ["apple", "banana"]
 * console.log(mm.get("vegetables")); 
 * // → ["carrot"]
 *
 * @example
 * const mm = new Map<number, boolean[]>();
 * const arr = multimapAdd(mm, 42, true);
 * console.log(arr);      
 * // → [true]
 * console.log(mm.get(42) === arr); 
 * // → true (same reference)
 */
export function multimapAdd<K, V>(m: Map<K, V[]>, k: K, v: V): V[] {
    const arr = m.get(k) ?? [];
    if(arr.length === 0) m.set(k, arr);

    arr.push(v);
    return arr;
}
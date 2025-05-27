/**
 * Add an element `v` to a `Map`-backed multi-map `m`.
 * @param m A multi-map, represented with `Map<K, V[]>`.
 * @param k Key for insertion.
 * @param v Value to insert.
 * @returns All elements from `m` with key `k`, with the inserted value. Mutating this array will also mutate the value in `m`.
 */
export function addMultiMap<K, V>(m: Map<K, V[]>, k: K, v: V): V[] {
    const arr = m.get(k) ?? [];
    if(arr.length === 0) m.set(k, arr);

    arr.push(v);
    return arr;
}
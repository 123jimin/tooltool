import type { Nullable, RecursivePartial } from "../type/index.ts";

/**
 * Accesses a nested record at the given path, returning both the current value and a setter function.
 *
 * @typeParam T The type of the value to be accessed.
 * 
 * @param obj The nested record to access
 * @param path An array of strings representing the path to the desired value
 * @returns A tuple containing:
 *   - `value`: The value at the path, or `undefined` if the path does not exist
 *   - `setValue`: A function that sets a new value at the path, creating intermediate objects as needed
 *
 * @example
 * const obj = { a: { b: { c: 42 } } };
 * const [value, setValue] = recordAccess<number>(obj, ['a', 'b', 'c']);
 * console.log(value); // 42
 * setValue(100);
 * console.log(obj.a.b.c); // 100
 */
export function recordAccess<T = unknown>(
    obj: Record<string, unknown>,
    ...path: Array<string|string[]>
): [T | undefined, (value: T) => void] {
    const flat_path = path.flat();

    let current: unknown = obj;
    for (const key of flat_path) {
        if (current == null || typeof current !== 'object') {
            current = (void 0);
            break;
        }
        current = (current as Record<string, unknown>)[key];
    }

    const setValue = (value: T): void => {
        if (flat_path.length === 0) {
            return;
        }

        let target: Record<string, unknown> = obj;

        for (let i = 0; i < flat_path.length-1; i++) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const key = flat_path[i]!;
            if (target[key] == null || typeof target[key] !== 'object') {
                target[key] = {};
            }
            target = target[key] as Record<string, unknown>;
        }

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        target[flat_path[flat_path.length-1]!] = value;
    };

    return [current as T | undefined, setValue];
}

/**
 * Recursively merges a patch object into a base object.
 *
 * This function performs a deep merge for nested records. Arrays and primitive types
 * in the `patch` object will overwrite the corresponding values in `base`.
 *
 * @typeParam T - The type of the base record.
 * @param base - The initial record object.
 * @param patch - The partial record containing updates. If `null` or `undefined`, `base` is returned as-is.
 * @returns A new object containing the merged properties.
 *
 * @example
 * const base = { a: 1, b: { c: 2 } };
 * const patch = { b: { d: 3 }, e: 4 };
 * const result = recursiveMerge(base, patch);
 * // { a: 1, b: { c: 2, d: 3 }, e: 4 }
 *
 * @remarks
 * - This function is pure; it does not modify `base` or `patch`.
 * - In some cases, the original `base` will be returned, so take care when modifying the result.
 * - Properties with `undefined` values in `patch` are ignored.
 * - Properties with `null` values in `patch` overwrite the values in `base`.
 */
export function recursiveMerge<T extends Record<string, unknown>>(base: T, patch: Nullable<RecursivePartial<T>>): T {
    if(patch == null || base === patch) return base;

    const patched: Record<string, unknown> = {...base};
    for(const [k, v] of Object.entries(patch)) {
        if(v === (void 0)) continue;
        if(v === null) {
            patched[k] = v;
            continue;
        }

        if((typeof v) !== 'object' || Array.isArray(v)) {
            patched[k] = v;
            continue;
        }

        patched[k] = recursiveMerge(patched[k] as Record<string, unknown>, v);
    }

    return patched as T;
}
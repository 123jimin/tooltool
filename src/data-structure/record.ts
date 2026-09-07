import type {Nullable, RecursivePartial} from "../type/index.ts";

/**
 * Accesses a nested record at the given path, returning a value and setter.
 *
 * @typeParam T - The value type.
 * @param obj - The nested record.
 * @param path - Path segments (strings or arrays of strings).
 * @returns `[value, setValue]` — the value is `undefined` if an own path segment is missing;
 *          the setter creates intermediate objects as needed.
 *
 * @remarks
 * Traverses only own properties. The setter creates own data properties, including
 * names such as `__proto__`, without following inherited objects or invoking inherited setters.
 * An empty path returns `obj` and a setter that does nothing. The returned value is
 * a snapshot of the access, not a live getter.
 *
 * @example
 * ```ts
 * const obj = { a: { b: { c: 42 } } };
 * const [value, setValue] = recordAccess<number>(obj, ['a', 'b', 'c']);
 * value;       // 42
 * setValue(100);
 * obj.a.b.c;   // 100
 * ```
 */
export function recordAccess<T = unknown>(
    obj: Record<string, unknown>,
    ...path: Array<string|string[]>
): [T | undefined, (value: T) => void] {
    const flat_path = path.flat();

    let current: unknown = obj;
    for(const key of flat_path) {
        if(current == null || typeof current !== 'object' || !Object.hasOwn(current, key)) {
            current = (void 0);
            break;
        }
        current = (current as Record<string, unknown>)[key];
    }

    const setValue = (value: T): void => {
        if(flat_path.length === 0) {
            return;
        }

        let target: Record<string, unknown> = obj;

        for(let i = 0; i < flat_path.length-1; i++) {
            const key = flat_path[i]!;
            let next = Object.hasOwn(target, key) ? target[key] : (void 0);
            if(next == null || typeof next !== 'object') {
                next = {};
                Object.defineProperty(target, key, {
                    value: next, enumerable: true, writable: true, configurable: true,
                });
            }
            target = next as Record<string, unknown>;
        }

        Object.defineProperty(target, flat_path[flat_path.length-1]!, {
            value, enumerable: true, writable: true, configurable: true,
        });
    };

    return [current as T | undefined, setValue];
}

/**
 * Recursively merges a patch into a base record without mutating either input.
 *
 * Arrays and primitives in `patch` overwrite `base`. Nested records are merged recursively.
 * A record-valued patch replaces a primitive, array, or nullish base value.
 *
 * @typeParam T - The base record type and allowed patch properties.
 * @param base - The base record.
 * @param patch - Recursive partial updates matching `T`, or `null` or `undefined` to leave `base` unchanged.
 * @returns The merged record, or `base` itself for a nullish or identical patch.
 *
 * @remarks
 * - Patch properties must match `T`; declare optional properties or an index signature to allow additional keys.
 * - Own enumerable string-keyed patch properties are applied; inherited properties are ignored.
 *   Names such as `__proto__` are handled as own data properties, not prototype operations.
 * - `undefined` patch values are ignored; `null` overwrites when allowed by the property's type.
 * - Non-nullish, non-identical patches create a new top-level record. Recursively merged branches
 *   are copied, while untouched branches and replacement arrays or objects share input references.
 *   This is not a deep clone.
 *
 * @example
 * ```ts
 * const base = { a: 1, b: { c: 2, d: 0 }, e: 0 };
 * const patch = { b: { d: 3 }, e: 4 };
 * recursiveMerge(base, patch); // { a: 1, b: { c: 2, d: 3 }, e: 4 }
 * ```
 */
export function recursiveMerge<T extends Record<string, unknown>>(base: T, patch: Nullable<RecursivePartial<T>>): T {
    if(patch == null || base === patch) return base;
    if(base == null) return patch as T;

    const patched: Record<string, unknown> = {...base};
    for(const [k, v] of Object.entries(patch)) {
        if(v === (void 0)) continue;
        let value = v;
        if(v !== null && typeof v === 'object' && !Array.isArray(v)) {
            const orig = Object.hasOwn(patched, k) ? patched[k] : (void 0);
            if(typeof orig === 'object' && orig !== null && !Array.isArray(orig)) {
                value = recursiveMerge(orig as Record<string, unknown>, v);
            }
        }
        Object.defineProperty(patched, k, {
            value, enumerable: true, writable: true, configurable: true,
        });
    }

    return patched as T;
}

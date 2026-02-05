import type { Nullable, RecursivePartial } from "../type/index.ts";

/**
 * Accesses a nested record at the given path, returning a value and setter.
 *
 * @typeParam T - The value type.
 * @param obj - The nested record.
 * @param path - Path segments (strings or arrays of strings).
 * @returns `[value, setValue]` — value is `undefined` if path doesn't exist;
 *          setter creates intermediate objects as needed.
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
 * Recursively merges a patch into a base object (deep merge).
 *
 * Arrays and primitives in `patch` overwrite `base`. Nested records are merged recursively.
 *
 * @typeParam T - The record type.
 * @param base - The base object.
 * @param patch - Partial updates. If nullish, `base` is returned.
 * @returns A new merged object.
 *
 * @remarks
 * - Does not mutate `base` or `patch`.
 * - May return `base` directly if `patch` is nullish.
 * - `undefined` values in `patch` are ignored; `null` values overwrite.
 *
 * @example
 * ```ts
 * const base = { a: 1, b: { c: 2 } };
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
        if(v === null) {
            patched[k] = v;
            continue;
        }

        if((typeof v) !== 'object' || Array.isArray(v)) {
            patched[k] = v;
            continue;
        }

        const orig = patched[k] as Record<string, unknown>;
        patched[k] = recursiveMerge(orig, v);
    }

    return patched as T;
}
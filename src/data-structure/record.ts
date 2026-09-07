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

// Index signatures describe possible keys, not guaranteed own properties.
type MergeProperty<T, K extends keyof T> =
    string extends keyof T ? T[K] | undefined
        : number extends keyof T ? K extends number ? T[K] | undefined : T[K]
            : T[K];

type MergeValue<Base, Patch> =
    Patch extends undefined ? Base
        : Patch extends readonly unknown[] | ((...args: never[]) => unknown) ? Patch
            : Patch extends object
                ? Base extends readonly unknown[] | ((...args: never[]) => unknown) ? Patch
                    : Base extends object
                        ? RecursiveMergeResult<Base, Patch>
                        : Patch
                : Patch;

/**
 * The inferred record merge, including additions and replacement value types.
 *
 * Required base keys stay required; definitely defined patch keys become required.
 * Other additions are optional because absent or undefined patch values are ignored.
 * Nullish whole patches retain `Base`, while null-valued properties replace their bases.
 * Union patches retain the possible unchanged and merged results.
 * Index signatures conservatively retain both base and patch possibilities.
 *
 * Models ordinary own enumerable record properties; TypeScript cannot distinguish
 * inherited or non-enumerable properties from own properties.
 */
export type RecursiveMergeResult<Base, Patch> =
    Patch extends null | undefined ? Base
        : Base extends unknown ? {
            [K in keyof Base]: K extends Extract<keyof Patch, string | number> ? MergeValue<Base[K], MergeProperty<Patch, K>>
                : string extends K ? Base[K] | MergeValue<Base[K] | undefined, Patch[Extract<keyof Patch, string | number>]>
                    : number extends K ? Base[K] | MergeValue<Base[K] | undefined, Patch[Extract<keyof Patch, number>]>
                        : Base[K];
        } & {
            [K in keyof Patch as K extends string | number ? K extends keyof Base ? never : K : never]?:
            string extends K ? MergeValue<Base[Extract<keyof Base, string | number>] | undefined, Patch[K] | undefined>
                : number extends K ? MergeValue<Base[Extract<keyof Base, number>] | undefined, Patch[K] | undefined>
                    : Patch[K];
        } & {
            [K in keyof Patch as K extends string | number ? undefined extends MergeProperty<Patch, K> ? never : K : never]-?:
            MergeValue<K extends keyof Base ? MergeProperty<Base, K> : undefined, Patch[K]>;
        } : never;

/**
 * Recursively merges a patch into a base record without mutating either input.
 *
 * Arrays and primitives in `patch` overwrite `base`. Nested records are merged recursively.
 * A record-valued patch replaces a primitive, array, or nullish base value.
 *
 * @typeParam Base - The base record type.
 * @typeParam Patch - The inferred patch type, including additions and replacements.
 * @param base - The base record.
 * @param patch - Record updates, or `null` or `undefined` to leave `base` unchanged.
 * @returns The merged record, or `base` itself for a nullish or identical patch.
 *
 * @remarks
 * - Patch properties may add keys or replace existing values with different types.
 * - Own enumerable string-keyed patch properties are applied; inherited properties are ignored.
 *   Names such as `__proto__` are handled as own data properties, not prototype operations.
 * - `undefined` patch values are ignored; `null` overwrites.
 * - Non-nullish, non-identical patches create a new top-level record. Recursively merged branches
 *   are copied, while untouched branches and replacement arrays or objects share input references.
 *   This is not a deep clone.
 *
 * @example
 * ```ts
 * const base = { a: 1, b: { c: 2 } };
 * const patch = { b: { d: 3 }, e: 4 };
 * recursiveMerge(base, patch); // { a: 1, b: { c: 2, d: 3 }, e: 4 }
 * ```
 */
export function recursiveMerge<
    Base extends Record<string, unknown>,
    Patch extends Nullable<object> = Nullable<RecursivePartial<Base>>,
>(base: Base, patch: Patch): RecursiveMergeResult<Base, Patch>;
export function recursiveMerge(base: Record<string, unknown>, patch: Nullable<object>): Record<string, unknown> {
    if(patch == null || base === patch) return base;
    if(base == null) return patch as Record<string, unknown>;

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

    return patched;
}

import type {Nullable, RecursivePartial} from "../type/index.ts";
import type {RecursiveAtomic} from "../type/recursive-atomic.ts";

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
        : Patch extends readonly unknown[] | RecursiveAtomic ? Patch
            : Patch extends object
                ? Base extends readonly unknown[] | RecursiveAtomic ? Patch
                    : Base extends object
                        ? MergeRecords<Base, Patch>
                        : Patch
                : Patch;

type MergeRecords<Base, Patch> = {
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
};

/**
 * The inferred record merge, including additions and replacement value types.
 *
 * Required base keys stay required; definitely defined patch keys become required.
 * Other additions are optional because absent or undefined patch values are ignored.
 * Nullish whole patches retain `Base`, while null-valued properties replace their bases.
 * Union patches retain the possible unchanged and merged results.
 * Index signatures conservatively retain both base and patch possibilities.
 *
 * Dates, regular expressions, mutable and readonly maps and sets, callable types,
 * and arrays are replacements. Other objects are modeled as ordinary records.
 * TypeScript cannot distinguish custom-class instances from matching plain records,
 * or inherited/non-enumerable members from own enumerable members. Runtime replacement
 * of such instances therefore cannot be inferred reliably: additive record members
 * are only guaranteed when those inputs are known to be plain records.
 */
export type RecursiveMergeResult<Base, Patch> =
    Patch extends null | undefined ? Base
        : MergeValue<Base, Patch>;

/**
 * Recursively merges a patch into a base record without mutating either input.
 *
 * Deep-merges only pairs of plain records. Arrays, functions, other objects, and
 * primitives replace their base values by reference rather than being traversed.
 *
 * @typeParam Base - The base record type.
 * @typeParam Patch - The inferred patch type, including additions and replacements.
 * @param base - The base record.
 * @param patch - Record updates, or `null` or `undefined` to leave `base` unchanged.
 * @returns The merged record, the replacement patch, or `base` for a nullish or identical patch.
 *
 * @remarks
 * - A plain record has exactly this realm's `Object.prototype` or `null` as its prototype.
 *   Class instances and records with another realm's object prototype are replacements.
 * - Patch properties may add keys or replace existing values with different types.
 * - Plain-record merges apply own enumerable string-keyed patch properties and ignore inherited
 *   properties. Names such as `__proto__` become own data properties, not prototype operations.
 *   An `undefined` field is ignored; a `null` field overwrites.
 * - Non-identical pairs of plain records create new ordinary records. Recursively merged
 *   branches are copied; untouched branches and replacement values retain input references.
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
export function recursiveMerge(base: Record<string, unknown>, patch: Nullable<object>): object {
    if(patch == null || base === patch) return base;
    return isPlainRecord(base) && isPlainRecord(patch) ? mergePlainRecords(base, patch) : patch;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
    if(typeof value !== "object" || value === null) return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
}

function mergePlainRecords(base: Record<string, unknown>, patch: Record<string, unknown>): Record<string, unknown> {
    if(base === patch) return base;
    const patched: Record<string, unknown> = {...base};
    for(const [k, v] of Object.entries(patch)) {
        if(v === (void 0)) continue;
        const orig = Object.hasOwn(patched, k) ? patched[k] : (void 0);
        const value = isPlainRecord(orig) && isPlainRecord(v) ? mergePlainRecords(orig, v) : v;
        Object.defineProperty(patched, k, {
            value, enumerable: true, writable: true, configurable: true,
        });
    }
    return patched;
}

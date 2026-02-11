import type {NestedArray} from "../type/index.ts";

/**
 * A synchronous transform function.
 *
 * Return a new value for pure transformation, or mutate in-place and return `undefined`.
 *
 * @typeParam T - The value type.
 * @see {@link applyTransforms}
 */
export type TransformFunction<T> = ((t: T) => T|undefined)|((t: T) => void);

/**
 * An asynchronous transform function.
 *
 * Return a new value for pure transformation, or mutate in-place and return `undefined`.
 *
 * @typeParam T - The value type.
 * @see {@link applyAsyncTransforms}
 */
export type AsyncTransformFunction<T> = ((t: T) => Promise<T|undefined>)|((t: T) => Promise<void>);

/**
 * Applies a sequence of synchronous transform functions to a value.
 *
 * Each function can return a new value (pure) or mutate in-place and return `undefined`.
 * Functions may be nested in arrays for organization; they are flattened during execution.
 *
 * @typeParam T - The value type.
 * @param obj - The initial value.
 * @param fns - Transform functions (may be nested arrays).
 * @returns The final transformed value.
 *
 * @example
 * ```ts
 * // Pure transformation
 * applyTransforms({ n: 1 }, (o) => ({ n: o.n + 1 })); // { n: 2 }
 *
 * // In-place mutation
 * applyTransforms({ n: 1 }, (o) => { o.n += 1; });    // { n: 2 }
 * ```
 *
 * @see {@link applyAsyncTransforms} for the async version.
 */
export function applyTransforms<T>(obj: T, ...fns: NestedArray<TransformFunction<T>>): T {
    for(const fn of fns) {
        if(Array.isArray(fn)) {
            obj = applyTransforms(obj, ...fn);
        } else {
            const res = fn(obj);
            if(res !== (void 0)) obj = res;
        }
    }

    return obj;
}

/**
 * Applies a sequence of async (or sync) transform functions to a value.
 *
 * Each function is awaited in order. Functions can return a new value (pure) or mutate
 * in-place and return `undefined`. Nested arrays are flattened.
 *
 * @typeParam T - The value type.
 * @param obj - The initial value.
 * @param fns - Transform functions (may be nested arrays).
 * @returns The final transformed value.
 *
 * @example
 * ```ts
 * const result = await applyAsyncTransforms(
 *     { id: 1 },
 *     async (o) => ({ ...o, data: await fetchData(o.id) }),
 * );
 * ```
 *
 * @see {@link applyTransforms} for the sync version.
 */
export async function applyAsyncTransforms<T>(obj: T, ...fns: NestedArray<AsyncTransformFunction<T>|TransformFunction<T>>): Promise<T> {
    for(const fn of fns) {
        if(Array.isArray(fn)) {
            obj = await applyAsyncTransforms(obj, ...fn);
        } else {
            const res = await fn(obj);
            if(res !== (void 0)) obj = res;
        }
    }

    return obj;
}

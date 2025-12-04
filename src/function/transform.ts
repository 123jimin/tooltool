import type { NestedArray } from "../type/index.ts";

/**
 * A synchronous transform function that takes a value and optionally returns a transformed value.
 * 
 * @typeParam T - The type of the value being transformed.
 * @param t - The value to transform.
 * @returns The transformed value, or `undefined` if the transformation was done in-place
 *          or no change is needed.
 * 
 * @see {@link applyTransforms} for applying multiple transform functions.
 */
export type TransformFunction<T> = ((t: T) => T|undefined)|((t: T) => void);

/**
 * An asynchronous transform function that takes a value and optionally returns a transformed value.
 * 
 * @typeParam T - The type of the value being transformed.
 * @param t - The value to transform.
 * @returns A promise that resolves to the transformed value, or `undefined` if the transformation
 *          was done in-place or no change is needed.
 * 
 * @see {@link applyAsyncTransforms} for applying multiple async transform functions.
 */
export type AsyncTransformFunction<T> = ((t: T) => Promise<T|undefined>)|((t: T) => Promise<void>);

/**
 * Applies a sequence of synchronous transform functions to a value.
 * 
 * Transform functions are applied sequentially in order. Each function can either:
 * - Return a new transformed value (pure transformation)
 * - Modify the value in-place and return `undefined` (impure transformation)
 * 
 * @typeParam T - The type of the value being transformed.
 * @param obj - The initial value to transform.
 * @param fns - Transform functions to apply, which can be arbitrarily nested in arrays
 *              for organizational purposes. Nested arrays are flattened during execution.
 * @returns The final transformed value after all transform functions have been applied.
 * 
 * @example
 * // Pure transformations (returning new values)
 * const result = applyTransforms(
 *     { count: 1 },
 *     (obj) => ({ ...obj, count: obj.count + 1 }),
 *     (obj) => ({ ...obj, doubled: obj.count * 2 }),
 * );
 * // result: { count: 2, doubled: 4 }
 * 
 * @example
 * // Impure transformations (modifying in-place)
 * const result = applyTransforms(
 *     { count: 1 },
 *     (obj) => { obj.count += 1; },
 *     (obj) => { obj.doubled = obj.count * 2; },
 * );
 * // result: { count: 2, doubled: 4 }
 * 
 * @see {@link TransformFunction} for the transform function signature.
 * @see {@link applyAsyncTransforms} for the asynchronous version.
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
 * Applies a sequence of asynchronous (and/or synchronous) transform functions to a value.
 * 
 * This is the asynchronous version of {@link applyTransforms}. Transform functions are
 * applied sequentially in order, with each function awaited before proceeding to the next.
 * Each function can either:
 * - Return a new transformed value (pure transformation)
 * - Modify the value in-place and return `undefined` (impure transformation)
 * 
 * @typeParam T - The type of the value being transformed.
 * @param obj - The initial value to transform.
 * @param fns - Transform functions to apply, which can be arbitrarily nested in arrays
 *              for organizational purposes.
 * @returns A promise that resolves to the final transformed value after all transform
 *          functions have been applied.
 * 
 * @example
 * // Async transformations with fetch
 * const result = await applyAsyncTransforms(
 *     { userId: 123 },
 *     async (obj) => {
 *         const response = await fetch(`/api/users/${obj.userId}`);
 *         const user = await response.json();
 *         return { ...obj, user };
 *     },
 *     async (obj) => {
 *         const response = await fetch(`/api/users/${obj.userId}/posts`);
 *         const posts = await response.json();
 *         return { ...obj, posts };
 *     },
 * );
 * // result: { userId: 123, user: {...}, posts: [...] }
 * 
 * @example
 * // Mixing sync and async transforms
 * const result = await applyAsyncTransforms(
 *     { count: 1 },
 *     (obj) => ({ ...obj, count: obj.count + 1 }),  // sync
 *     async (obj) => {
 *         await someAsyncOperation();
 *         return { ...obj, processed: true };
 *     },  // async
 * );
 * // result: { count: 2, processed: true }
 * 
 * @see {@link AsyncTransformFunction} for the async transform function signature.
 * @see {@link TransformFunction} for the sync transform function signature.
 * @see {@link applyTransforms} for the synchronous version.
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
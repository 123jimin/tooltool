/**
 * Represents values that are either `null` or `undefined`.
 * 
 * @example
 * ```ts
 * const value: Nullish = null;
 * const other: Nullish = undefined;
 * ```
 */
export type Nullish = null | undefined;

/**
 * Utility type that extends a type to also accept `null` or `undefined`.
 * 
 * @template T - The base type to make nullable
 * 
 * @example
 * ```ts
 * const name: Nullable<string> = null;
 * const age: Nullable<number> = undefined;
 * const user: Nullable<User> = { id: 1, name: 'Alice' };
 * ```
 */
export type Nullable<T> = T | Nullish;

/**
 * Type guard that checks whether a value is nullish (`null` or `undefined`).
 * 
 * @param value - The value to check
 * @returns `true` if the value is `null` or `undefined`, `false` otherwise
 * 
 * @example
 * ```ts
 * if (isNullish(user)) {
 *   console.log('User is not defined');
 * }
 * 
 * const values = [1, null, 2, undefined, 3];
 * const defined = values.filter(v => !isNullish(v)); // [1, 2, 3]
 * ```
 */
export function isNullish(value: unknown): value is Nullish {
  return value == null;
}
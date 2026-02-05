/** Represents `null` or `undefined`. */
export type Nullish = null | undefined;

/**
 * Extends a type to also accept `null` or `undefined`.
 *
 * @typeParam T - The base type.
 */
export type Nullable<T> = T | Nullish;

/**
 * Type guard: checks if a value is nullish (`null` or `undefined`).
 *
 * @param value - The value to check.
 * @returns `true` if nullish.
 *
 * @example
 * ```ts
 * isNullish(null);      // true
 * isNullish(undefined); // true
 * isNullish(0);         // false
 * ```
 */
export function isNullish(value: unknown): value is Nullish {
  return value == null;
}
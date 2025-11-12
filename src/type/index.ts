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

/**
 * Compile-time assertion that two types are exactly equal.
 * 
 * This function performs a bidirectional type check to ensure `T` and `U` are
 * the same type. It causes a TypeScript compilation error if the types differ.
 * The function body is empty as verification happens entirely at the type level.
 * 
 * @template T - The first type to compare
 * @template U - The second type to compare
 * 
 * @remarks
 * This utility is useful in tests or when verifying type relationships at compile time.
 * 
 * @example
 * ```ts
 * type A = { name: string };
 * type B = { name: string };
 * type C = { name: string; age: number };
 * 
 * assertEqualType<A, B>(); // ✓ OK - types are equal
 * assertEqualType<A, C>(); // ✗ Error - types differ
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function assertEqualType<T, U extends T>(..._: [T] extends [U] ? [] : [never]): void {}
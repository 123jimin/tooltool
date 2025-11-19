export * from "./nullable.js";

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
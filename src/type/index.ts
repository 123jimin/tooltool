export * from "./json.ts";
export * from "./nullable.ts";
export * from "./result.ts";

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

/**
 * Represents a single element within a {@link NestedArray}.
 * 
 * This type is either the leaf value of type `T` or a nested array structure.
 * 
 * @template T - The type of the leaf values.
 */
export type NestedArrayElement<T> = T | NestedArray<T>;

/**
 * Represents an array that can be nested to an arbitrary depth.
 * 
 * This structure is commonly used when dealing with recursive data or flat-map operations.
 * 
 * @template T - The type of the leaf values found within the structure.
 * 
 * @example
 * ```ts
 * const flat: NestedArray<number> = [1, 2, 3];
 * const deep: NestedArray<number> = [1, [2, [3, 4]], 5];
 * ```
 */
export type NestedArray<T> = NestedArrayElement<T>[];

/**
 * Recursively makes all properties of type `T` optional.
 * 
 * Unlike the standard `Partial<T>`, this type traverses down the object structure,
 * making every nested property optional as well. Useful for patch objects or
 * configuration overrides where you don't want to specify the full structure.
 * 
 * @template T - The type to be made recursively partial.
 */
export type RecursivePartial<T> =
    [T] extends [Array<infer U>] ? Array<RecursivePartial<U>> :
    [T] extends [object] ? {[P in keyof T]?: RecursivePartial<T[P]>} :
    T;

    
/**
 * Represents a value that may or may not be wrapped in a `Promise`.
 *
 * Convenient for APIs that accept both synchronous and asynchronous return
 * values, avoiding the need for callers to wrap synchronous results.
 *
 * @template T - The underlying value type.
 *
 * @example
 * ```ts
 * async function process(input: Promisable<string>): Promise<number> {
 *     const value = await input;
 *     return value.length;
 * }
 *
 * process('hello');                  // ✓ OK — synchronous
 * process(Promise.resolve('hello')); // ✓ OK — asynchronous
 * ```
 */
export type Promisable<T> = T | Promise<T>;

/**
 * Converts a type into a tuple that is optional when `T` is `void` or `undefined`.
 *
 * Designed for use with rest parameters in generic functions, allowing callers
 * to omit the argument entirely when the type indicates no value is expected.
 *
 * @template T - The type to evaluate for optionality.
 *
 * @example
 * ```ts
 * function dispatch<T>(action: string, ...payload: OptionalIfVoid<T>): void {
 *     // ...
 * }
 *
 * dispatch<void>('reset');           // ✓ OK — payload omitted
 * dispatch<number>('increment', 5);  // ✓ OK — payload required
 * dispatch<number>('increment');     // ✗ Error — missing argument
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export type OptionalIfVoid<T> = [T] extends [undefined|void] ? [t?: T] : [T];
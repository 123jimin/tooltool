import type {RecursiveAtomic} from "./recursive-atomic.ts";

export * from "./json.ts";
export * from "./nullable.ts";
export * from "./result.ts";

/**
 * Asserts at compile time that two types are mutually assignable.
 *
 * Checks assignability in both directions, not exact type identity. Structurally
 * compatible types can pass even if they differ in readonly or optional members.
 * Performs no runtime validation.
 *
 * @typeParam T - The first type to compare.
 * @typeParam U - The second type to compare.
 *
 * @example
 * ```ts
 * type A = { name: string };
 * type B = { name: string };
 * type C = { name: string; age: number };
 *
 * assertEqualType<A, B>(); // OK: mutually assignable
 * assertEqualType<A, C>(); // Error: A is not assignable to C
 * ```
 */

export function assertEqualType<T, U extends T>(..._: [T] extends [U] ? [] : [never]): void {}

/**
 * Represents a single element within a {@link NestedArray}.
 *
 * This type is either the leaf value of type `T` or a nested array structure.
 *
 * @typeParam T - The type of the leaf values.
 */
export type NestedArrayElement<T> = T | NestedArray<T>;

/**
 * Represents an array that can be nested to an arbitrary depth.
 *
 * This structure is commonly used when dealing with recursive data or flat-map operations.
 *
 * @typeParam T - The type of the leaf values found within the structure.
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
 * Distributes over unions, retaining primitive and nullish members while making
 * nested object properties optional. Useful for patches and configuration overrides.
 *
 * @remarks
 * Mutable arrays contain recursively partial elements; mutable tuples widen to
 * arrays. Unions of arrays keep separate array branches rather than combining
 * their element types into one array. Readonly arrays and tuples follow optional
 * mapped-type semantics.
 * Dates, regular expressions, mutable and readonly maps and sets, and callable
 * types are atomic: their members and call signatures are preserved unchanged.
 * Other object types are treated structurally. TypeScript cannot distinguish
 * custom-class instances from matching plain records, so their data properties
 * become optional; callable methods remain callable when present.
 *
 * @typeParam T - The type to be made recursively partial.
 *
 * @example
 * ```ts
 * const patch: RecursivePartial<{ settings?: { theme: string; size: number } | null }> = {
 *     settings: { theme: "dark" },
 * };
 * ```
 */
export type RecursivePartial<T> =
    T extends RecursiveAtomic ? T
        : T extends Array<infer U> ? Array<RecursivePartial<U>>
            : T extends object ? {[P in keyof T]?: RecursivePartial<T[P]>}
                : T;

/**
 * Represents a value that may or may not be wrapped in a `Promise`.
 *
 * Convenient for APIs that accept both synchronous and asynchronous return
 * values, avoiding the need for callers to wrap synchronous results.
 *
 * @typeParam T - The underlying value type.
 *
 * @example
 * ```ts
 * async function process(input: Promisable<string>): Promise<number> {
 *     const value = await input;
 *     return value.length;
 * }
 *
 * process("hello");                  // Synchronous value
 * process(Promise.resolve("hello")); // Promise
 * ```
 */
export type Promisable<T> = T | Promise<T>;

/**
 * Converts a type into a tuple whose element is optional when `T` is assignable
 * to `void | undefined`.
 *
 * Designed for rest parameters. The check considers the whole type, so a union
 * such as `string | undefined` still requires an argument.
 *
 * @typeParam T - The type to evaluate for optionality.
 *
 * @example
 * ```ts
 * function dispatch<T>(action: string, ...payload: OptionalIfVoid<T>): void {
 *     // ...
 * }
 *
 * dispatch<void>("reset");          // Payload omitted
 * dispatch<number>("increment", 5); // Payload required
 * dispatch<number>("increment");    // Error: missing argument
 * ```
 */

export type OptionalIfVoid<T> = [T] extends [undefined|void] ? [t?: T] : [T];

/** Type that can be `null` or `undefined`. */
export type Nullable<T> = T | null | undefined;

/** Null-like type, that can be checked via `== null`. */
export type NullLike = null | undefined;

/** Asserts that two types are equal. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function assertEqualType<T, U extends T>(..._: [T] extends [U] ? [] : [never]): void {}
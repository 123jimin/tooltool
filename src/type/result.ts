/**
 * A successful result.
 *
 * @typeParam T - Success value type.
 */
export interface Ok<T> {
    ok: true;
    value: T;
}

/**
 * A failed result.
 *
 * @typeParam E - Failure value type; need not extend `Error` (default: `Error`).
 */
export interface Err<E = Error> {
    ok: false;
    error: E;
}

/**
 * A discriminated union representing success or failure.
 *
 * @typeParam T - Success value type.
 * @typeParam E - Failure value type; need not extend `Error` (default: `Error`).
 */
export type Result<T, E = Error> = Ok<T> | Err<E>;

/**
 * Checks whether a result is successful, narrowing it to {@link Ok}.
 *
 * @param result - The result to check.
 * @returns `true` if `Ok`, `false` otherwise.
 *
 * @example
 * ```ts
 * if (isResultOk(result)) {
 *   console.log(result.value);
 * }
 * ```
 */
export function isResultOk<T, E = Error>(result: Result<T, E>): result is Ok<T> {
    return result.ok;
}

/**
 * Checks whether a result is failed, narrowing it to {@link Err}.
 *
 * @param result - The result to check.
 * @returns `true` if `Err`, `false` otherwise.
 *
 * @example
 * ```ts
 * if (isResultErr(result)) {
 *   console.log(result.error.message);
 * }
 * ```
 */
export function isResultErr<T, E = Error>(result: Result<T, E>): result is Err<E> {
    return !result.ok;
}

/**
 * Extracts the value from a successful result, or throws the error.
 *
 * @param result - The result to unwrap.
 * @returns The success value.
 * @throws The original failure value, including values that are not `Error` instances.
 *
 * @remarks
 * The `ok` discriminant controls unwrapping; falsy and nullish success values
 * are returned unchanged.
 *
 * @example
 * ```ts
 * resultUnwrap({ ok: true, value: 42 });  // 42
 * resultUnwrap({ ok: false, error: e });  // throws e
 * ```
 */
export function resultUnwrap<T, E = Error>(result: Result<T, E>): T {
    if(result.ok) {
        return result.value;
    } else {
        throw result.error;
    }
}

/**
 * Extracts the value from a successful result, or returns a fallback.
 *
 * @param result - The result to unwrap.
 * @param fallback - Value to return if `Err`.
 * @returns The success value or fallback.
 *
 * @remarks
 * The fallback is returned only for `Err`, not for falsy or nullish success values.
 * Use {@link resultUnwrapOrElse} to defer computing an expensive fallback.
 *
 * @example
 * ```ts
 * resultUnwrapOr({ ok: true, value: 42 }, 0);  // 42
 * resultUnwrapOr({ ok: false, error: e }, 0);  // 0
 * ```
 */
export function resultUnwrapOr<T, E = Error, U = T>(result: Result<T, E>, fallback: U): T|U {
    return result.ok ? result.value : fallback;
}

/**
 * Extracts the value from a successful result, or computes a fallback from the error.
 *
 * @param result - The result to unwrap.
 * @param fallback - Called once, only for `Err`, with the original failure value.
 * @returns The success value or the computed fallback.
 *
 * @remarks
 * Returns falsy and nullish success values unchanged. The fallback runs
 * synchronously; exceptions it throws propagate to the caller.
 *
 * @example
 * ```ts
 * resultUnwrapOrElse({ ok: true, value: 42 }, () => 0);    // 42
 * resultUnwrapOrElse({ ok: false, error: e }, () => -1);   // -1
 * ```
 */
export function resultUnwrapOrElse<T, E = Error, U = T>(result: Result<T, E>, fallback: (error: E) => U): T|U {
    return result.ok ? result.value : fallback(result.error);
}

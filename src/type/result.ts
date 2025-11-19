export interface Ok<T> {
    ok: true;
    value: T;
}

export interface Err<E = Error> {
    ok: false;
    error: E;
}

export type Result<T, E = Error> = Ok<T> | Err<E>;

export function isResultOk<T, E = Error>(result: Result<T, E>): result is Ok<T> {
    return result.ok;
}

export function isResultErr<T, E = Error>(result: Result<T, E>): result is Err<E> {
    return !result.ok;
}

export function resultUnwrap<T, E = Error>(result: Result<T, E>): T {
    if (result.ok) {
        return result.value;
    } else {
        throw result.error;
    }
}

export function resultUnwrapOr<T, E = Error, U = T>(result: Result<T, E>, fallback: U): T|U {
    return result.ok ? result.value : fallback;
}

export function resultUnwrapOrElse<T, E = Error, U = T>(result: Result<T, E>, fallback: (error: E) => U): T|U {
    return result.ok ? result.value : fallback(result.error);
}
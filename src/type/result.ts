export interface Ok<T> {
    ok: true;
    value: T;
}

export interface Err<E = Error> {
    ok: false;
    error: E;
}

export type Result<T, E = Error> = Ok<T> | Err<E>;

export function resultUnwrap<T, E = Error>(result: Result<T, E>): T {
    if (result.ok) {
        return result.value;
    } else {
        throw result.error;
    }
}
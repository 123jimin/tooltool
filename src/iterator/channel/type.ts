import type { OptionalIfVoid } from "../../type/index.ts";

export interface AsyncSink<Y, R=void, T=unknown> {
    next(y: Y): void;
    complete(...args: OptionalIfVoid<R>): void;
    error(err: T): void;
}

export interface AsyncChannel<Y, R=void, T=unknown> extends AsyncSink<Y, R, T>, AsyncIterable<Y, R> {
    result(): Promise<R>;
}
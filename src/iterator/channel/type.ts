import type { AsyncEvent } from "../generator.ts";
import type { OptionalIfVoid } from "../../type/index.ts";

export interface AsyncSink<Y, R=void, E=unknown> {
    next(y: Y): void;
    complete(...args: OptionalIfVoid<R>): void;
    error(err: E): void;
}

export interface AsyncSource<Y, R=void, E=unknown> extends AsyncIterable<Y, R> {
    subscribe(callback: (event: AsyncEvent<Y, R, E>) => void): void;

    onYield(callback: (y: Y) => void): void;
    onReturn(callback: (ret: R) => void): void;
    onThrow(callback: (err: E) => void): void;

    result(): Promise<R>;
}

export interface AsyncChannel<Y, R=void, E=unknown> extends AsyncSink<Y, R, E>, AsyncSource<Y, R, E> {}
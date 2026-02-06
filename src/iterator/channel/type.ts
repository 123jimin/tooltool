import type { AsyncEvent } from "../generator.ts";
import type { OptionalIfVoid } from "../../type/index.ts";

/**
 * Write-side of an async channel that pushes values, completion, or errors.
 *
 * @typeParam Y - Yielded value type.
 * @typeParam R - Return value type.
 * @typeParam E - Error type (default: `unknown`).
 *
 * @see {@link AsyncSource} for the read-side counterpart.
 * @see {@link AsyncChannel} for the combined read/write interface.
 *
 * @example
 * ```ts
 * declare const sink: AsyncSink<number, string>;
 * sink.next(1);
 * sink.next(2);
 * sink.complete("done");
 * ```
 */
export interface AsyncSink<Y, R=void, E=unknown> {
    /** Pushes a yielded value into the channel. */
    next(y: Y): void;
    /**
     * Completes the channel with a return value.
     *
     * @remarks
     * The argument is optional when `R` is `void` or `undefined`.
     */
    complete(...args: OptionalIfVoid<R>): void;
    /** Terminates the channel with an error. */
    error(err: E): void;
}

/**
 * Read-side of an async channel that consumes values via iteration or callbacks.
 *
 * Implements `AsyncIterable`, so it can be consumed with `for await...of`.
 * Each iterator returned by `[Symbol.asyncIterator]()` replays from the
 * beginning of the buffered events independently.
 *
 * @typeParam Y - Yielded value type.
 * @typeParam R - Return value type.
 * @typeParam E - Error type (default: `unknown`).
 *
 * @see {@link AsyncSink} for the write-side counterpart.
 * @see {@link AsyncChannel} for the combined read/write interface.
 *
 * @example
 * ```ts
 * declare const source: AsyncSource<number, string>;
 *
 * for await (const v of source) console.log(v);
 * console.log(await source.result());
 * ```
 */
export interface AsyncSource<Y, R=void, E=unknown> extends AsyncIterable<Y, R> {
    /**
     * Subscribes to all events (yield, return, and throw) as they arrive.
     *
     * @remarks
     * Immediately flushes any already-buffered events to `callback`, then
     * continues to deliver new events in order.
     */
    subscribe(callback: (event: AsyncEvent<Y, R, E>) => void): void;

    /** Subscribes to yielded values only. */
    onYield(callback: (y: Y) => void): void;
    /** Subscribes to the return value only. */
    onReturn(callback: (ret: R) => void): void;
    /** Subscribes to thrown errors only. */
    onThrow(callback: (err: E) => void): void;

    /**
     * Returns a promise that resolves with the channel's return value,
     * or rejects with its error.
     */
    result(): Promise<R>;
}

/**
 * Bidirectional async channel combining {@link AsyncSink} and {@link AsyncSource}.
 *
 * Provides a write-side for pushing values and a read-side for consuming them
 * via async iteration or event callbacks.
 *
 * @typeParam Y - Yielded value type.
 * @typeParam R - Return value type.
 * @typeParam E - Error type (default: `unknown`).
 *
 * @example
 * ```ts
 * declare const ch: AsyncChannel<number, string>;
 * ch.next(1);
 * ch.next(2);
 * ch.complete("done");
 *
 * for await (const v of ch) console.log(v); // 1, 2
 * console.log(await ch.result()); // "done"
 * ```
 */
export interface AsyncChannel<Y, R=void, E=unknown> extends AsyncSink<Y, R, E>, AsyncSource<Y, R, E> {}
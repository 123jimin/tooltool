import type {OptionalIfVoid} from "../../type/index.ts";
import type {AsyncSink} from "./type.ts";

/**
 * Pipes yielded values and the final return value from an async source to an
 * async sink, forwarding failures from advancing the source to `sink.error()`.
 *
 * Consumes the source and calls the appropriate sink methods: `next()` for each yielded
 * value, `complete()` when the source finishes successfully, and `error()` if the source
 * throws.
 *
 * @typeParam Y - The type of values yielded by the source
 * @typeParam R - The type of the final return value
 * @typeParam T - The type of errors that may be thrown
 *
 * @param source - The async iterable or iterator to consume
 * @param sink - The destination sink that receives values and notifications
 *
 * @returns Resolves after source completion or an error has been delivered to the sink.
 * @throws Propagates exceptions from sink methods or obtaining the source iterator.
 *
 * @remarks
 * Sink methods run synchronously and are not awaited. A source error is handled
 * by `sink.error()` and does not itself reject the returned promise; a throwing
 * sink method does reject it and stops piping.
 *
 * @example
 * ```ts
 * const sink: AsyncSink<number, void> = {
 *     next: (n) => console.log(`Value: ${n}`),
 *     complete: () => console.log('Done!'),
 *     error: (err) => console.error('Error:', err),
 * };
 *
 * async function* gen() {
 *     yield 1;
 *     yield 2;
 *     yield 3;
 * }
 *
 * await pipeToAsyncSink(gen(), sink);
 * // Logs: "Value: 1", "Value: 2", "Value: 3", "Done!"
 * ```
 */
export async function pipeToAsyncSink<Y, R = void, T = unknown>(
    source: AsyncIterable<Y, R> | AsyncIterator<Y, R>,
    sink: AsyncSink<Y, R, T>,
): Promise<void> {
    const iterator: AsyncIterator<Y, R> = Symbol.asyncIterator in source
        ? source[Symbol.asyncIterator]()
        : source;

    while(true) {
        let result: IteratorResult<Y, R>;
        try {
            result = await iterator.next();
        } catch (err) {
            sink.error(err as T);
            return;
        }

        if(result.done) {
            sink.complete(...[result.value] as OptionalIfVoid<R>);
            return;
        }

        sink.next(result.value);
    }
}

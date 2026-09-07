import type {AsyncEvent} from "../generator.ts";
import {createAsyncSource} from "./source.ts";
import type {AsyncChannel} from "./type.ts";

/**
 * Creates an async channel that buffers values and replays them to each iterator.
 *
 * @typeParam Y - Yielded value type.
 * @typeParam R - Return value type.
 * @typeParam T - Thrown error type (default: `unknown`).
 * @returns An {@link AsyncChannel}.
 *
 * @remarks
 * Each call to `[Symbol.asyncIterator]()` returns a fresh iterator starting
 * from the first buffered value. Calling `result()` multiple times returns
 * the same promise without affecting iteration.
 * A rejected result is internally observed, so iteration-only consumers do not
 * cause an unhandled result rejection; callers of `result()` still receive it.
 *
 * Subscribers run synchronously. If one throws, it is detached, all other
 * pending consumers are notified, and the first callback exception is rethrown
 * to the producer. Callback exceptions do not change the channel's result,
 * including on completion or error. Exceptions during buffered replay instead
 * propagate from the subscription call.
 *
 * Buffered events are retained for the lifetime of the channel; memory grows
 * with the number of events. Stopping one iterator does not stop the producer.
 *
 * @example
 * ```ts
 * const ch = createAsyncChannel<number, string>();
 * ch.next(1);
 * ch.next(2);
 * ch.complete("done");
 *
 * for await (const v of ch) console.log(v); // 1, 2
 * console.log(await ch.result()); // "done"
 * ```
 */
export function createAsyncChannel<Y, R = void, T = unknown>(): AsyncChannel<Y, R, T> {
    const events: AsyncEvent<Y, R, T>[] = [];
    const waiters: Array<() => void> = [];

    let resolveResult: ((result: R) => void) | null = null;
    let rejectResult: ((error: T) => void) | null = null;

    const result_promise = new Promise<R>((resolve, reject) => {
        resolveResult = resolve;
        rejectResult = reject;
    });
    // Observe the internal promise without replacing the result exposed to callers.
    void result_promise.catch(() => {});

    const push = (event: AsyncEvent<Y, R, T>) => {
        events.push(event);

        switch(event.type) {
            case 'return':
                resolveResult?.(event.value);
                break;
            case 'throw':
                rejectResult?.(event.value);
                break;
        }

        let callback_failed = false;
        let first_error: unknown;
        for(const waiter of waiters.splice(0)) {
            try {
                waiter();
            } catch (err) {
                if(!callback_failed) {
                    callback_failed = true;
                    first_error = err;
                }
            }
        }

        if(callback_failed) throw first_error;
    };

    const source = createAsyncSource<Y, R, T>(events, waiters, result_promise);

    return {
        next(y: Y): void { push({type: 'yield', value: y}); },
        complete(...args): void {
            const r = (args.length > 0 ? args[0] : (void 0)) as R;
            push({type: 'return', value: r});
        },
        error(err: T): void { push({type: 'throw', value: err}); },
        ...source,
    };
}

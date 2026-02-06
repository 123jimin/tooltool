import type { AsyncEvent } from "../generator.ts";
import type { AsyncChannel } from "./type.ts";
import { createAsyncSource } from "./source.ts";

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
export function createAsyncChannel<Y, R=void, T=unknown>(): AsyncChannel<Y, R, T> {
    const events: AsyncEvent<Y, R, T>[] = [];
    const waiters: Array<() => void> = [];

    let resolveResult: ((result: R) => void) | null = null;
    let rejectResult: ((error: T) => void) | null = null;

    const result_promise = new Promise<R>((resolve, reject) => {
        resolveResult = resolve;
        rejectResult = reject;
    });

    const push = (event: AsyncEvent<Y, R, T>) => {
        events.push(event);

        const ignore_err = event.type === 'return';

        try {
            for (const waiter of waiters.splice(0)) {
                waiter();
            }
        } catch(err) {
            if(!ignore_err) {
                rejectResult?.(err as T);
                return;
            }
        }

        switch(event.type) {
            case 'return':
                resolveResult?.(event.value);
                return;
            case 'throw':
                rejectResult?.(event.value);
                return;
        }
    };

    const source = createAsyncSource<Y, R, T>(events, waiters, result_promise);

    return {
        next(y: Y): void { push({ type: 'yield', value: y }); },
        complete(...args): void {
            const r = (args.length > 0 ? args[0] : (void 0)) as R;
            push({ type: 'return', value: r });
        },
        error(err: T): void { push({ type: 'throw', value: err }); },
        ...source,
    };
}
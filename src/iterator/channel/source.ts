import type {AsyncEvent} from "../generator.ts";
import type {AsyncSource} from "./type.ts";

/**
 * Creates an {@link AsyncSource} backed by a shared event buffer.
 *
 * @typeParam Y - Yielded value type.
 * @typeParam R - Return value type.
 * @typeParam E - Error type.
 * @param events - The shared event buffer to read from.
 * @param waiters - The shared waiter list; resolved when new events arrive.
 * @param result_promise - A promise that resolves/rejects with the channel result.
 * @returns An {@link AsyncSource}.
 */
export function createAsyncSource<Y, R, E>(
    events: AsyncEvent<Y, R, E>[],
    waiters: Array<() => void>,
    result_promise: Promise<R>,
): AsyncSource<Y, R, E> {
    return {
        subscribe(callback: (event: AsyncEvent<Y, R, E>) => void): void {
            let position = 0;

            const flush = () => {
                while(position < events.length) {
                    callback(events[position]!);
                    position++;
                }
            };

            flush();
            waiters.push(flush);
        },
        onYield(callback) {
            this.subscribe((e) => { if(e.type === 'yield') callback(e.value); });
        },
        onReturn(callback) {
            this.subscribe((e) => { if(e.type === 'return') callback(e.value); });
        },
        onThrow(callback) {
            this.subscribe((e) => { if(e.type === 'throw') callback(e.value); });
        },
        async* [Symbol.asyncIterator](): AsyncGenerator<Y, R> {
            let position = 0;

            while(true) {
                while(position < events.length) {
                    const event = events[position]!;
                    position++;

                    switch(event.type) {
                        case 'yield': yield event.value; break;
                        case 'return': return event.value;
                        case 'throw': throw event.value;
                    }
                }

                await new Promise<void>((resolve) => {
                    waiters.push(resolve);
                });
            }
        },
        result(): Promise<R> {
            return result_promise;
        },
    };
}

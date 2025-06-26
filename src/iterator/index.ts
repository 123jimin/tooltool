import { Nullable } from "../type/index.js";

export type AsyncYieldEvent<Y> = {type: 'yield'; value: Y};
export type AsyncReturnEvent<R> = {type: 'return'; value: R};
export type AsyncThrowEvent<T=unknown> = {type: 'throw'; value: T};
export type AsyncEvent<Y, R, T=unknown> = AsyncYieldEvent<Y> | AsyncReturnEvent<R> | AsyncThrowEvent<T>;

export interface AsyncGeneratorExecutor<Y, R, T=unknown> {
    yeet(y: Y): void;
    done(r: R): void;
    fail(t: T): void;
}

/**
 * Converts a callback-based API to a generator-based API.
 * @param executor A function that receives callbacks for yielding(`yeet`), returning(`done`), and throwing(`fail`).
 */
export async function* toAsyncGenerator<Y, R, T=unknown>(executor: (callbacks: AsyncGeneratorExecutor<Y, R, T>) => void): AsyncGenerator<Y ,R> {
    const queue: Array<AsyncEvent<Y, R, T>> = [];

    let resolveNext: Nullable<(() => void)> = null;

    const push = (event: AsyncEvent<Y, R, T>) => {
        queue.push(event);
        if(resolveNext) {
            const localResolveNext = resolveNext;
            resolveNext = null;
            localResolveNext();
        }
    };

    try {
        executor({
            yeet(y) { push({type: 'yield', value: y}); },
            done(r) { push({type: 'return', value: r}); },
            fail(e) { push({type: 'throw', value: e}); },
        });
    } catch(err) {
        push({type: 'throw', value: err as T});
    }

    while(true) {
        if(queue.length === 0) {
            await new Promise<void>((resolve) => {
                resolveNext = resolve;
            });
        }

        while(queue.length > 0) {
            const event = queue.shift();
            if(!event) continue;

            switch(event.type) {
                case 'yield': { yield event.value; break; }
                case 'return': { return event.value; }
                case 'throw': { throw event.value; }
            }
        }
    }
}

/**
 * Converts an async generator to a promise.
 * @param gen Original generator.
 * @param onYeet Optional function to be called each time the generator yields.
 */
export async function generatorToPromise<Y, R>(gen: AsyncGenerator<Y, R>, onYeet?: (y: Y) => void): Promise<R> {
    if(onYeet) {
        for await (const y of gen) { onYeet(y); }
    } else {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for await (const _ of gen) { /* nop */ }
    }

    while(true) {
        const {value, done}: IteratorResult<Y, R> = await gen.next();
        if(done) return value;
        if(value) onYeet?.(value);
    }
}
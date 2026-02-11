import {isAsyncIterable} from "./util.ts";

async function* asyncBatched<T>(
    gen: AsyncGenerator<T>,
    n: number,
): AsyncGenerator<T[]> {
    let batch: T[] = [];
    for await (const item of gen) {
        batch.push(item);
        if(batch.length === n) {
            yield batch;
            batch = [];
        }
    }

    if(batch.length > 0) {
        yield batch;
    }
}

function* syncBatched<T>(
    gen: Generator<T>,
    n: number,
): Generator<T[]> {
    let batch: T[] = [];
    for(const item of gen) {
        batch.push(item);
        if(batch.length === n) {
            yield batch;
            batch = [];
        }
    }

    if(batch.length > 0) {
        yield batch;
    }
}

/**
 * Yields elements from a generator in batches of size `n`.
 *
 * @typeParam T - Element type.
 * @param gen - The source generator (sync or async).
 * @param n - Batch size.
 * @returns A generator yielding arrays of up to `n` elements.
 *
 * @example
 * ```ts
 * [...batched(range(10), 3)]; // [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9]]
 * ```
 */
export function batched<T>(gen: Generator<T>, n: number): Generator<T[]>;
export function batched<T>(
    gen: AsyncGenerator<T>,
    n: number,
): AsyncGenerator<T[]>;
export function batched<T>(
    gen: Generator<T> | AsyncGenerator<T>,
    n: number,
): Generator<T[]> | AsyncGenerator<T[]> {
    if(isAsyncIterable(gen)) {
        return asyncBatched(gen, n);
    } else {
        return syncBatched(gen, n);
    }
}

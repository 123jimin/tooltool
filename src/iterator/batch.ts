import { isAsyncIterable } from "./generator.js";

async function* asyncBatched<T>(
    gen: AsyncGenerator<T>,
    n: number,
): AsyncGenerator<T[]> {
    const batch: T[] = [];
    for await (const item of gen) {
        batch.push(item);
        if (batch.length === n) {
            yield batch;
            batch.length = 0;
        }
    }

    if (batch.length > 0) {
        yield batch;
    }
}

/**
 * Creates a generator that yields elements of the given generator in batches of `n`.
 *
 * @example
 * ```ts
 * import { batched } from "./batch";
 * import { range } from "./range";
 *
 * const a = batched(range(10), 3);
 * console.log([...a]);
 * // => [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9]]
 * ```
 *
 * @param gen A generator to process.
 * @param n A size of the batch.
 * @returns A new generator that yields arrays of elements from the given generator.
 */
export function batched<T>(gen: Generator<T>, n: number): Generator<T[]>;
export function batched<T>(
    gen: AsyncGenerator<T>,
    n: number,
): AsyncGenerator<T[]>;
export function* batched<T>(
    gen: Generator<T> | AsyncGenerator<T>,
    n: number,
): Generator<T[]> | AsyncGenerator<T[]> {
    if (isAsyncIterable(gen)) {
        return asyncBatched(gen, n);
    }

    let batch: T[] = [];
    for (const item of gen) {
        batch.push(item);
        if (batch.length === n) {
            yield batch;
            batch = [];
        }
    }

    if (batch.length > 0) {
        yield batch;
    }
}

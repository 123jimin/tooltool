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
 * @param n - Nonnegative integer batch size; `0` collects the complete source.
 * @returns A generator yielding batches; an empty source yields no batches.
 * @throws {RangeError} If `n` is negative, fractional, or nonfinite.
 *
 * @remarks
 * Positive sizes yield arrays of up to `n` elements, including a final partial
 * batch. Size `0` yields one array only after the source finishes, using memory
 * proportional to the entire source; an infinite source never yields a batch
 * and can exhaust memory. Invalid sizes throw when `batched()` is called.
 * Exiting a batch loop early closes the source generator.
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
    if(!Number.isInteger(n) || n < 0) {
        throw new RangeError("Batch size must be a nonnegative finite integer.");
    }

    return isAsyncIterable(gen) ? asyncBatched(gen, n) : syncBatched(gen, n);
}

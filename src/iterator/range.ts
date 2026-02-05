/**
 * Internal helper for generating a range of numbers.
 */
function* _rangeNumber(start: number, end: number, raw_step?: number): Generator<number> {
    const step = raw_step ?? 1;

    if (step === 0) {
        throw new Error("Step cannot be zero.");
    }

    if (step > 0) {
        for (let i = start; i < end; i += step) {
            yield i;
        }
    } else { // step < 0
        for (let i = start; i > end; i += step) {
            yield i;
        }
    }
}

/**
 * Internal helper for generating a range of bigints.
 */
function* _rangeBigInt(start: bigint, end: bigint, raw_step?: bigint): Generator<bigint> {
    const step = raw_step ?? 1n;

    if (step === 0n) {
        throw new Error("Step cannot be zero.");
    }

    if (step > 0n) {
        for (let i = start; i < end; i += step) {
            yield i;
        }
    } else { // step < 0
        for (let i = start; i > end; i += step) {
            yield i;
        }
    }
}

/**
 * Creates a lazy generator yielding a sequence of numbers or bigints (like Python's `range()`).
 *
 * - `range(end)` — `[0, end)`
 * - `range(start, end)` — `[start, end)`
 * - `range(start, end, step)` — `[start, end)` with custom step
 *
 * Default step is `1` (or `1n`). For descending ranges, provide a negative step.
 *
 * @param start - Start of sequence (or `end` if only one argument).
 * @param end - End of sequence (exclusive).
 * @param step - Increment (default: `1` or `1n`).
 * @returns A `Generator` yielding the sequence.
 * @throws {Error} If `step` is `0` or `0n`.
 *
 * @remarks
 * Floating-point arguments may cause imprecise results due to accumulation errors.
 * Use integers for reliable sequences.
 *
 * @example
 * ```ts
 * [...range(5)];           // [0, 1, 2, 3, 4]
 * [...range(5, 10)];       // [5, 6, 7, 8, 9]
 * [...range(0, 10, 2)];    // [0, 2, 4, 6, 8]
 * [...range(5, 0, -1)];    // [5, 4, 3, 2, 1]
 * [...range(0n, 5n)];      // [0n, 1n, 2n, 3n, 4n]
 * ```
 */
export function range(start: number, end?: number, step?: number): Generator<number>;
export function range(start: bigint, end?: bigint, step?: bigint): Generator<bigint>;
export function* range(raw_start: number | bigint, raw_end?: number | bigint, raw_step?: number | bigint): Generator<number | bigint> {
    // Handle the single-argument case: range(end)
    if (raw_end == null) {
        raw_end = raw_start;
        // Set start to 0 of the appropriate type
        raw_start = typeof raw_start === 'bigint' ? 0n : 0;
    }

    // Cast arguments and delegate to the appropriate typed helper function.
    // The `as` assertions are safe due to TypeScript's overload resolution and the initial type check.
    if (typeof raw_start === 'bigint') {
        yield* _rangeBigInt(raw_start, raw_end as bigint, raw_step as bigint | undefined);
    } else {
        yield* _rangeNumber(raw_start, raw_end as number, raw_step as number | undefined);
    }
}
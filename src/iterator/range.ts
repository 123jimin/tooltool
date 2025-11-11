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
 * Creates a generator that yields a sequence of numbers or bigints.
 *
 * This function behaves similarly to Python's `range()`. It's lazy, returning a
 * `Generator` that produces values on demand. The `end` value is exclusive.
 *
 * It can be called in three ways:
 * 1. `range(end)`: Creates a sequence from `0` up to (but not including) `end`.
 * 2. `range(start, end)`: Creates a sequence from `start` up to (but not including) `end`.
 * 3. `range(start, end, step)`: Creates a sequence from `start` with a given `step`.
 *
 * The default step is always `1` (or `1n`). To count down, an explicit negative step must be provided.
 *
 * @remarks
 * **Warning on Floating-Point Numbers:**
 * While this function accepts floating-point numbers for `start`, `end`, and `step`,
 * their use can lead to unexpected behavior due to the inherent imprecision of
 * floating-point arithmetic. Accumulating a fractional `step` may result in values
 * that are slightly off, potentially causing the sequence to include an extra
 * element or miss the last one. For predictable and reliable sequences, it is
 * strongly recommended to use integers.
 * 
 * @param start - The start of the sequence. If `end` is not provided, this value is treated as `end`, and `start` defaults to `0` or `0n`.
 * @param end - The end of the sequence (exclusive).
 * @param step - The increment between numbers. Defaults to `1` (or `1n`).
 * @returns A `Generator` that yields numbers in the specified range.
 * @throws {Error} If the provided `step` is `0` or `0n`.
 *
 * @example Basic usage
 * ```ts
 * [...range(5)];
 * //> [0, 1, 2, 3, 4]
 * ```
 *
 * @example With a start and end
 * ```ts
 * [...range(5, 10)];
 * //> [5, 6, 7, 8, 9]
 * ```
 *
 * @example With a positive step
 * ```ts
 * [...range(0, 10, 2)];
 * //> [0, 2, 4, 6, 8]
 * ```
 *
 * @example Counting down requires an explicit negative step
 * ```ts
 * [...range(5, 0, -1)];
 * //> [5, 4, 3, 2, 1]
 * ```
 *
 * @example An empty range
 * ```ts
 * [...range(5, 0)]; // Default step is 1, so this yields nothing.
 * //> []
 * ```
 *
 * @example Using bigints
 * ```ts
 * [...range(0n, 5n)];
 * //> [0n, 1n, 2n, 3n, 4n]
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
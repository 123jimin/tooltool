/**
 * Clamps a value to the inclusive range `[min, max]`.
 *
 * @typeParam T - `number` or `bigint`.
 * @param value - The value to clamp.
 * @param min - Lower bound (inclusive).
 * @param max - Upper bound (inclusive).
 * @returns The clamped value.
 *
 * @example
 * ```ts
 * clamp(15, 0, 10);    // 10
 * clamp(-2n, -1n, 5n); // -1n
 * ```
 */
export function clamp(value: number, min: number, max: number): number;
export function clamp(value: bigint, min: bigint, max: bigint): bigint;
export function clamp<T extends number|bigint>(value: T, min: T, max: T): T {
    if(value <= min) return min;
    if(max <= value) return max;
    return value;
}

/**
 * Linearly interpolates between two values.
 *
 * @param a - Start value.
 * @param b - End value.
 * @param t - Interpolation factor (`[0, 1]` for normal range; any real accepted).
 * @returns `a + (b - a) * t`.
 *
 * @example
 * ```ts
 * lerp(0, 10, 0.25); // 2.5
 * lerp(0, 10, 1.5);  // 15
 * ```
 */
export function lerp(a: number, b: number, t: number): number {
    if(t < 0.5) {
        return a + (b-a) * t;
    } else {
        return b - (b-a) * (1-t);
    }
}

/**
 * Computes the ceiling of integer division `n / d`.
 *
 * @param n - Dividend.
 * @param d - Divisor (non-zero).
 * @returns Smallest integer ≥ `n / d`.
 *
 * @throws {RangeError} If `d` is zero.
 * @throws {TypeError} If arguments are not both safe integers or both bigints.
 *
 * @example
 * ```ts
 * ceilDiv(7, 3);    // 3
 * ceilDiv(-7n, 3n); // -2n
 * ```
 */
export function ceilDiv(n: number, d: number): number;
export function ceilDiv(n: bigint, d: bigint): bigint;
export function ceilDiv(n: number | bigint, d: number | bigint): number|bigint {
    if(d === 0 || d === 0n) {
        throw new RangeError("Division by zero");
    }

    if(typeof n === "number" && typeof d === "number") {
        if(!(Number.isSafeInteger(n) && Number.isSafeInteger(d))) {
            throw new TypeError("Arguments must be safe integers");
        }

        const q = Math.trunc(n / d);
        const r = n % d;
        if(r === 0) return q;

        return q + ((n > 0) === (d > 0) ? 1 : 0);
    } else if(typeof n === "bigint" && typeof d === "bigint") {
        const q = n / d;
        const r = n % d;
        return r === 0n ? q : q + ((n > 0n) === (d > 0n) ? 1n : 0n);
    }

    throw new TypeError("Both arguments must be of the same type");
}

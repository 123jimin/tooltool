/**
 * Clamps `value` to be between `min` and `max`.
 * 
 * @param value The number to clamp.
 * @param min The minimum allowable value.
 * @param max The maximum allowable value.
 */
export function clamp(value: number, min: number, max: number): number;
export function clamp(value: bigint, min: bigint, max: bigint): bigint;
export function clamp<T extends number|bigint>(value: T, min: T, max: T): T {
    if(value <= min) return min;
    if(max <= value) return max;
    return value;
}

/**
 * Performs linear interpolation between two values.
 * 
 * @param a The start value.
 * @param b The end value.
 * @param t The interpolation factor.
 * @returns The interpolated value between `a` and `b`: `a + (b-a)*t`.
 */
export function lerp(a: number, b: number, t: number): number {
    if (t < 0.5) {
        return a + (b-a) * t;
    } else {
        return b - (b-a) * (1-t);
    }
}

/**
 * Computes the ceiling of the division `n/d`.
 * 
 * @param n The dividend (numerator), which must be an integer.
 * @param d The divisor (denominator), which must be a non-zero integer.
 * @returns The ceiling of the division `n/d`.
 * @throws {Error} If `d` is zero.
 */
export function ceilDiv(n: number, d: number): number;
export function ceilDiv(n: bigint, d: bigint): bigint;
export function ceilDiv(n: number | bigint, d: number | bigint): number|bigint {
	if (d === 0 || d === 0n) {
		throw new RangeError("Division by zero");
	}
	
	if (typeof n === "number" && typeof d === "number") {
		if(!(Number.isSafeInteger(n) && Number.isSafeInteger(d))) {
			throw new TypeError("Arguments must be safe integers");
		}

		const q = Math.trunc(n / d);
		const r = n % d;
		if(r === 0) return q;

		return q + (n > 0 === d > 0 ? 1 : 0);
	} else if (typeof n === "bigint" && typeof d === "bigint") {
		const q = n / d;
		const r = n % d;
		return r === 0n ? q : q + (n > 0n === d > 0n ? 1n : 0n);
	}
	
	throw new TypeError("Both arguments must be of the same type");
}
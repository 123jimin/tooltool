/**
 * Formats an integer as a fixed-point decimal string.
 *
 * It treats the input integer `n` as if it were multiplied by `10**fractions`.
 * Useful for formatting currency or other fixed-point values stored as integers.
 *
 * @param n - The integer value to format.
 * @param fractions - The number of decimal places.
 * @returns A string representation of the fixed-point number.
 *
 * @example
 * formatFixedFloat(1234, 2); // "12.34"
 * formatFixedFloat(100, 2); // "1.00"
 */
export function formatFixedFloat(n: number, fractions: number): string {
    if(fractions <= 0) return `${n}`;
    
    const d = 10 ** fractions;
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    const rem = abs % d;
    return `${sign}${Math.floor(abs / d)}.${rem.toString().padStart(fractions, '0')}`;
}

/**
 * Formats a number with an explicit sign prefix (+, -, or ±).
 *
 * @param n - The number to format.
 * @param min_len - The minimum length of the numeric part (padding applied to absolute value).
 * @param fill_string - The string used to pad the numeric part (default: ' ').
 * @returns The formatted string including the sign.
 *
 * @remarks
 * Zero (0) is denoted with '±'.
 *
 * @example
 * formatSignedInt(42); // "+42"
 * formatSignedInt(-5); // "-5"
 * formatSignedInt(0); // "±0"
 * formatSignedInt(5, 3, '0'); // "+005"
 */
export function formatSignedInt(n: number, min_len?: number, fill_string?: string) {
    let abs_n: string = (n < 0 ? -n : n).toString();
    if(min_len) abs_n = abs_n.padStart(min_len, fill_string);

    const n_sign_prefix = n === 0 ? '\u00B1' : n > 0 ? '+' : '-';
    return n_sign_prefix + abs_n;
}
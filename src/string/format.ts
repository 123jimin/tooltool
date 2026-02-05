/**
 * Formats an integer as a fixed-point decimal string.
 *
 * Treats `n` as if multiplied by `10 ** fractions`. Useful for currency formatting.
 *
 * @param n - The integer value.
 * @param fractions - Number of decimal places.
 * @returns The formatted string.
 *
 * @example
 * ```ts
 * formatFixedFloat(1234, 2); // "12.34"
 * formatFixedFloat(100, 2);  // "1.00"
 * ```
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
 * Formats a number with an explicit sign prefix (`+`, `-`, or `±` for zero).
 *
 * @param n - The number to format.
 * @param min_len - Minimum length of the numeric part (pads absolute value).
 * @param fill_string - Padding string (default: `' '`).
 * @returns The formatted string with sign prefix.
 *
 * @example
 * ```ts
 * formatSignedInt(42);        // "+42"
 * formatSignedInt(-5);        // "-5"
 * formatSignedInt(0);         // "±0"
 * formatSignedInt(5, 3, '0'); // "+005"
 * ```
 */
export function formatSignedInt(n: number, min_len?: number, fill_string?: string) {
    let abs_n: string = (n < 0 ? -n : n).toString();
    if(min_len) abs_n = abs_n.padStart(min_len, fill_string);

    const n_sign_prefix = n === 0 ? '\u00B1' : n > 0 ? '+' : '-';
    return n_sign_prefix + abs_n;
}
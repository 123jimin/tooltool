/**
 * Formats an integer as a fixed-point decimal string.
 *
 * Interprets `n` as integer minor units and formats `n / 10 ** fractions`.
 * Useful for currency amounts stored as cents or other fixed-point values.
 *
 * @param n - The finite integer value in minor units.
 * @param fractions - Integer number of decimal places; non-positive values leave `n` unscaled.
 * @returns The formatted string.
 *
 * @remarks
 * Positive `fractions` pads the fractional part to that many digits when the
 * numeric parts use ordinary decimal notation. Large magnitudes are not expanded
 * from exponent notation, so their output may not be a conventional fixed-point
 * decimal. Input precision is limited by JavaScript numbers; formatting cannot
 * recover digits already lost when representing `n`.
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
 * @param min_len - Minimum UTF-16 length of the numeric part, excluding the sign.
 * @param fill_string - Padding string (default: `' '`).
 * @returns The formatted string with sign prefix.
 *
 * @remarks
 * Uses the number's string representation without rounding or truncating it to an
 * integer. Padding is applied before the numeric part but after the sign; an empty
 * padding string adds nothing. Both positive and negative zero use `±`.
 *
 * @example
 * ```ts
 * formatSignedInt(42);        // "+42"
 * formatSignedInt(-5);        // "-5"
 * formatSignedInt(0);         // "±0"
 * formatSignedInt(5, 3, '0'); // "+005"
 * ```
 */
export function formatSignedInt(n: number, min_len?: number, fill_string?: string): string {
    let abs_n: string = (n < 0 ? -n : n).toString();
    if(min_len) abs_n = abs_n.padStart(min_len, fill_string);

    const n_sign_prefix = n === 0 ? '\u00B1' : n > 0 ? '+' : '-';
    return n_sign_prefix + abs_n;
}

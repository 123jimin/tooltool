/**
 * Regular expression source string for matching a UUID.
 * 
 * This is a partial pattern (without anchors or flags) designed to be composed
 * into larger regular expressions. The pattern matches the standard 8-4-4-4-12
 * hexadecimal UUID format.
 * 
 * @remarks
 * - Uses uppercase `[0-9A-F]` character class; combine with the `i` flag for case-insensitive matching
 * - Does not validate UUID version or variant bits
 * - Does not include `^` or `$` anchors
 * 
 * @example
 * ```ts
 * // Match UUID within a larger string
 * const pattern = new RegExp(`id:\\s*(${REGEX_SRC_UUID})`, 'i');
 * const match = 'id: 550e8400-e29b-41d4-a716-446655440000'.match(pattern);
 * ```
 */
export const REGEX_SRC_UUID = `[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}`;

/**
 * Regular expression for matching a complete UUID string.
 * 
 * Matches UUIDs in the standard 8-4-4-4-12 hexadecimal format (case-insensitive).
 * Requires exact match from start to end of string.
 * 
 * @remarks
 * - Case-insensitive (matches both uppercase and lowercase)
 * - Does not validate UUID version or variant bits
 * - Matches any string in UUID format, not just valid UUIDs
 * 
 * @example
 * ```ts
 * REGEX_UUID.test('550e8400-e29b-41d4-a716-446655440000'); // true
 * REGEX_UUID.test('550E8400-E29B-41D4-A716-446655440000'); // true
 * REGEX_UUID.test('not-a-uuid'); // false
 * REGEX_UUID.test('550e8400-e29b-41d4-a716'); // false (incomplete)
 * ```
 */
export const REGEX_UUID = new RegExp(`^${REGEX_SRC_UUID}$`, 'i');

/**
 * Escapes special characters in a string for safe use in a regular expression.
 * 
 * This utility function escapes all characters that have special meaning in
 * regular expressions, allowing you to safely use user input or dynamic strings
 * as literal patterns.
 * 
 * @param s - String to escape.
 * @returns The escaped string safe for use in a `RegExp` constructor.
 * 
 * @deprecated This polyfill will be removed in the future.
 * Use native `RegExp.escape()` when available.
 * 
 * @remarks
 * Escapes the following characters: `. * + ? ^ $ { } ( ) | [ ] \`
 * 
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/escape | RegExp.escape() (MDN)}
 * 
 * @example
 * ```ts
 * const user_input = 'example.com';
 * const pattern = new RegExp(escapeRegExp(user_input));
 * 
 * pattern.test('example.com');     // true
 * pattern.test('exampleXcom');     // false (. is literal, not wildcard)
 * 
 * // Without escaping, . would match any character
 * new RegExp(user_input).test('exampleXcom'); // true (. matches X)
 * ```
 */
export function escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
/**
 * Provides regex source matching a UUID-shaped value (8-4-4-4-12 hex format, no anchors).
 *
 * Use the `i` flag for case-insensitive matching.
 *
 * @remarks
 * Does not validate UUID version or variant bits.
 *
 * @example
 * ```ts
 * const pattern = new RegExp(`id:\\s*(${REGEX_SRC_UUID})`, 'i');
 * ```
 */
export const REGEX_SRC_UUID = `[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}`;

/**
 * Matches a complete UUID-shaped string (case-insensitive, anchored).
 *
 * @remarks
 * Checks only the hexadecimal layout, not UUID version or variant bits.
 * Use {@link REGEX_SRC_UUID} to search within a larger string.
 *
 * @example
 * ```ts
 * REGEX_UUID.test('550e8400-e29b-41d4-a716-446655440000'); // true
 * REGEX_UUID.test('not-a-uuid');                           // false
 * ```
 */
export const REGEX_UUID = new RegExp(`^${REGEX_SRC_UUID}$`, 'i');

/**
 * Escapes regex metacharacters for a literal pattern outside character classes.
 *
 * @param s - String to escape.
 * @returns Regex source matching `s` literally when used as a standalone pattern.
 *
 * @remarks
 * Suitable for the `RegExp` constructor, not for generating JavaScript regex literals.
 * Does not escape character-class punctuation such as `-`, or prevent a leading
 * digit from extending an adjacent escape. Native `RegExp.escape()` handles those
 * embedding hazards as well.
 *
 * @deprecated Use native `RegExp.escape()` when available.
 *
 * @example
 * ```ts
 * new RegExp(escapeRegExp('example.com')).test('example.com');   // true
 * new RegExp(escapeRegExp('example.com')).test('exampleXcom');   // false
 * ```
 */
export function escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

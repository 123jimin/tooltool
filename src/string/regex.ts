/**
 * Regex source for matching a UUID (8-4-4-4-12 hex format, no anchors).
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
 * Regex for matching a complete UUID string (case-insensitive, anchored).
 *
 * @example
 * ```ts
 * REGEX_UUID.test('550e8400-e29b-41d4-a716-446655440000'); // true
 * REGEX_UUID.test('not-a-uuid');                           // false
 * ```
 */
export const REGEX_UUID = new RegExp(`^${REGEX_SRC_UUID}$`, 'i');

/**
 * Escapes special regex characters in a string.
 *
 * @param s - String to escape.
 * @returns Escaped string safe for `RegExp` constructor.
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
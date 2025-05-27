/** Regular expression source string for matching a UUID. */
export const REGEX_SRC_UUID = `[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}`;

/** Regular expression for matching a UUID. */
export const REGEX_UUID = new RegExp(`^${REGEX_SRC_UUID}$`, 'i');

/**
 * Polyfill for `RegExp.escape`.
 * @param s String to escape.
 * @returns `s` escaped for use in a regular expression.
 */
export function escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
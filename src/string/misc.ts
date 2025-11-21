/**
 * Trim begin and end of text, and also remove all indentations.
 *
 * @param text The text to trim.
 * @returns The trimmed and de-indented text.
 * @example
 * const text = `
 *   Hello,
 *     world!
 * `;
 * const trimmed = trimIndented(text);
 * // trimmed === "Hello,\nworld!"
 */
export function trimIndented(text: string): string {
    return text.trim().split(/\r?\n/).map((line) => line.trimStart()).join('\n');
}

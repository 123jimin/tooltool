/**
 * Trims whitespace from start/end and removes all leading indentation from each line.
 *
 * @param text - The text to trim.
 * @returns The trimmed and de-indented text.
 *
 * @example
 * ```ts
 * trimIndented(`
 *     Hello,
 *       world!
 * `); // "Hello,\nworld!"
 * ```
 */
export function trimIndented(text: string): string {
    return text.trim().split(/\r?\n/).map((line) => line.trimStart()).join('\n');
}

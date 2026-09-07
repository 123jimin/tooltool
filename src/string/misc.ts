/**
 * Trims leading/trailing blank lines and removes the common leading indentation from each line.
 *
 * Uses the minimum indentation of non-blank lines, counted in whitespace characters.
 * Useful for cleaning up indented template literals.
 *
 * @param text - The text to dedent.
 * @returns The trimmed and dedented text.
 *
 * @remarks
 * Whitespace-only lines do not contribute to indentation and become empty strings.
 * Tabs and spaces each count as one character; no tab expansion is performed.
 * Normalizes LF and CRLF to LF; preserves trailing whitespace on non-blank lines.
 *
 * @example
 * ```ts
 * dedent(`
 *     Hello,
 *       world!
 * `); // "Hello,\n  world!"
 * ```
 */
export function dedent(text: string): string {
    const lines = text.split(/\r?\n/);
    const blank_line = /^\s*$/u;

    while(lines.length > 0 && blank_line.test(lines[0]!)) lines.shift();
    while(lines.length > 0 && blank_line.test(lines[lines.length - 1]!)) lines.pop();

    if(lines.length === 0) return '';

    let common_indent = Number.POSITIVE_INFINITY;
    for(const line of lines) {
        if(blank_line.test(line)) continue;
        const indent = line.length - line.trimStart().length;
        if(indent < common_indent) common_indent = indent;
    }

    return lines.map((line) => blank_line.test(line) ? '' : line.slice(common_indent)).join('\n');
}

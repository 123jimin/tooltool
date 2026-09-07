/**
 * Trims leading/trailing blank lines and removes the common leading indentation from each line.
 *
 * Computes the minimum indentation across all non-empty lines, then strips that
 * many leading whitespace characters from every line. Useful for cleaning up
 * indented template literals.
 *
 * @param text - The text to dedent.
 * @returns The trimmed and dedented text.
 *
 * @remarks
 * Empty lines (whitespace-only) do not contribute to the common indent calculation
 * and become empty strings in the output. Mixed tabs and spaces are treated as
 * individual characters; no tab-width expansion is performed. LF and CRLF line
 * endings are normalized to LF; trailing whitespace on non-blank lines is preserved.
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

    if(!Number.isFinite(common_indent)) common_indent = 0;

    return lines.map((line) => blank_line.test(line) ? '' : line.slice(common_indent)).join('\n');
}

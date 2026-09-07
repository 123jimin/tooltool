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

    while(lines.length > 0 && lines[0]!.trim() === '') lines.shift();
    while(lines.length > 0 && lines[lines.length - 1]!.trim() === '') lines.pop();

    if(lines.length === 0) return '';

    let common_indent = Number.POSITIVE_INFINITY;
    for(const line of lines) {
        if(line.trim() === '') continue;
        const indent = line.length - line.trimStart().length;
        if(indent < common_indent) common_indent = indent;
    }

    if(!Number.isFinite(common_indent)) common_indent = 0;

    return lines.map((line) => line.trim() === '' ? '' : line.slice(common_indent)).join('\n');
}

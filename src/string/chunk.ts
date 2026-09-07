/**
 * Splits text into trimmed, non-empty chunks, preferring separators over forced splits.
 *
 * @param text - The text to split.
 * @param max_length - Maximum chunk length in UTF-16 code units (positive safe integer).
 * @param separators - Literal split points in priority order (default: `['\n', ' ', '.']`).
 * @returns The trimmed, non-empty chunks.
 * @throws {RangeError} If `max_length` is not a positive safe integer.
 *
 * @remarks
 * - For text exceeding the limit, uses the rightmost eligible occurrence of the first
 *   matching separator: its start must be at least `Math.floor(max_length / 2)` and
 *   its end within the limit. Separators stay in the preceding chunk unless trimmed.
 * - Trims every chunk and skips empty chunks.
 * - Never splits surrogate pairs; a non-BMP code point with `max_length = 1` is
 *   the sole length-limit exception (2 units). Unpaired surrogates are preserved.
 * - Code-point safety is not grapheme safety: combining marks and ZWJ sequences may split.
 *
 * @example
 * ```ts
 * chunkText('hello world', 5);     // ['hello', 'world']
 * chunkText('hello world', 7);     // ['hello', 'world']
 * chunkText('abcdefghij', 5);      // ['abcde', 'fghij']
 * chunkText('a b c d e', 4);       // ['a b', 'c d', 'e']
 * ```
 */
export function chunkText(text: string, max_length: number, separators: string[] = ['\n', ' ', '.']): string[] {
    if(!Number.isSafeInteger(max_length) || max_length <= 0) throw new RangeError(`chunkText: invalid max_length=${max_length}`);
    text = text.trim();

    const chunks: string[] = [];

    while(text.length > max_length) {
        const split_length = getNextChunkLength(text, max_length, separators);
        const chunk = text.slice(0, split_length).trimEnd();
        text = text.slice(split_length).trimStart();

        if(chunk) chunks.push(chunk);
    }

    if(text) chunks.push(text);
    return chunks;
}

/**
 * Calculates the optimal length for the next text chunk.
 *
 * For text exceeding the limit, uses the rightmost eligible occurrence of the first
 * matching separator. Its start must be at least `Math.floor(max_length / 2)`,
 * and its end must fit within the limit at a code-point boundary.
 *
 * @param text - The text to split; whitespace is not trimmed.
 * @param max_length - Maximum chunk length in UTF-16 code units (positive safe integer).
 * @param separators - Literal split points in priority order (default: `['\n', ' ', '.']`).
 * @returns The raw prefix length, including its separator, or 0 for empty text.
 * @throws {RangeError} If `max_length` is not a positive safe integer.
 *
 * @remarks
 * Returns the whole length if the text already fits. Otherwise, falls back to the
 * largest prefix within the limit that does not split a surrogate pair.
 * With `max_length` equal to 1, an initial non-BMP code point returns 2.
 * This is code-point safety, not grapheme safety: combining marks and ZWJ sequences
 * can still be separated. The returned length may exceed the trimmed chunk's length.
 *
 * @example
 * ```ts
 * getNextChunkLength('hello world', 7); // 6 (includes the space)
 * getNextChunkLength('abcdefghij', 5);  // 5
 * ```
 */
export function getNextChunkLength(text: string, max_length: number, separators: string[] = ['\n', ' ', '.']): number {
    if(!Number.isSafeInteger(max_length) || max_length <= 0) throw new RangeError(`getNextChunkLength: invalid max_length=${max_length}`);
    if(text.length <= max_length) return text.length;
    if(max_length === 1) return text.codePointAt(0)! > 0xFFFF ? 2 : 1;

    const comfortable_ind = Math.floor(max_length / 2);

    for(const c of separators) {
        const search_limit = max_length - c.length;
        if(search_limit < 0) continue;

        let last_index = text.lastIndexOf(c, search_limit);
        while(last_index >= comfortable_ind) {
            const split_length = last_index + c.length;
            if(text.codePointAt(split_length - 1)! <= 0xFFFF) return split_length;
            last_index = text.lastIndexOf(c, last_index - 1);
        }
    }

    return text.codePointAt(max_length - 1)! > 0xFFFF ? max_length - 1 : max_length;
}

/**
 * Splits text into chunks with a maximum length, preferring to split at separators.
 *
 * @param text - The text to split.
 * @param max_length - Maximum chunk length (positive safe integer).
 * @param separators - Split points in order of preference (default: `['\n', ' ', '.']`).
 * @returns Array of text chunks.
 * @throws {RangeError} If `max_length` is not a positive safe integer.
 *
 * @remarks
 * - Separators are only considered in the latter half of each chunk to avoid tiny chunks.
 * - Each chunk is trimmed (leading/trailing whitespace removed) before being added to results.
 * - Empty chunks (after trimming) are skipped.
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
    if(text.length === 0) return [];
    if(max_length === 1) return text.split('');

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
 * Splits at the last separator within `max_length`, considering only separators
 * in the latter half to avoid tiny chunks.
 *
 * @param text - The text to split.
 * @param max_length - Maximum chunk length (positive safe integer).
 * @param separators - Split points in order of preference (default: `['\n', ' ', '.']`).
 * @returns The calculated chunk length.
 * @throws {RangeError} If `max_length` is not a positive safe integer.
 */
export function getNextChunkLength(text: string, max_length: number, separators: string[] = ['\n', ' ', '.']): number {
    if(!Number.isSafeInteger(max_length) || max_length <= 0) throw new RangeError(`getNextChunkLength: invalid max_length=${max_length}`);
    if(text.length === 0) return 0;
    if(text.length <= max_length) return text.length;
    if(max_length === 1) return 1;

    const comfortable_ind = (max_length >> 1);

    for(const c of separators) {
        const search_limit = max_length - c.length;
        if(search_limit < 0) continue;

        const last_index = text.lastIndexOf(c, search_limit);
        if(last_index >= 0 && last_index >= comfortable_ind) return last_index + c.length;
    }

    return max_length;
}
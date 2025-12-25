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
 * Determines the optimal length for the next text chunk, ensuring it does not exceed the specified maximum length.
 *
 * It attempts to split the text at the last occurrence of a separator within the `max_length`.
 * To avoid creating excessively small chunks, it only considers separators found in the latter half of the potential chunk (defined as `max_length >> 1`).
 *
 * If no suitable separator is found, or if the text is shorter than `max_length`, it returns `max_length` (or the text length).
 *
 * @param text - The text to be split.
 * @param max_length - The hard limit for the chunk length. Must be a positive integer.
 * @param separators - A list of characters or substrings to split by, in order of preference. Defaults to `['\n', ' ', '.']`.
 * @returns The calculated length of the next chunk.
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
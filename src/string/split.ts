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
 *
 * @example
 * ```ts
 * const text = "Hello world. This is a test.";
 *
 * // Splits at space after 'Hello' (index 5 + 1)
 * getNextSplitLength(text, 10); // -> 6 ("Hello ")
 *
 * // Splits at period (index 11 + 1)
 * getNextSplitLength(text, 15); // -> 12 ("Hello world.")
 *
 * // No separator found in comfortable range, returns max_length
 * getNextSplitLength("1234567890", 5); // -> 5
 * ```
 */
export function getNextSplitLength(text: string, max_length: number, separators: string[] = ['\n', ' ', '.']): number {
    if(!Number.isSafeInteger(max_length) || max_length <= 0) throw new RangeError(`getNextSplitLength: invalid max_length=${max_length}`);
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
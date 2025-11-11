export type RowCol = [row: number, col: number];

/**
 * Get the row and column position of a character in a string.
 * 
 * @param s - The target string to search within.
 * @param ind - The zero-based index of the character. Must satisfy `0 <= ind && ind <= s.length`.
 *              When `ind === s.length`, returns the position after the last character.
 * @param pretty - If `true`, returns a human-readable string "row:col" (1-based).
 *                 If `false` or omitted, returns a tuple `[row, col]` (0-based).
 * 
 * @returns 
 * - When `pretty` is `false`: A tuple `[row, col]` where both values are 0-based.
 * - When `pretty` is `true`: A string in the format "row:col" where both values are 1-based.
 * 
 * @throws {RangeError} If `ind` is negative or greater than `s.length`.
 * 
 * @remarks
 * - Line breaks are determined by the newline character (`\n`).
 * - Carriage returns (`\r`) are treated as regular characters, not line breaks.
 * 
 * @example
 * ```ts
 * const text = "hello\nworld";
 * 
 * getRowCol(text, 0);        // [0, 0] - 'h' at row 0, col 0
 * getRowCol(text, 5);        // [0, 5] - '\n' at row 0, col 5
 * getRowCol(text, 6);        // [1, 0] - 'w' at row 1, col 0
 * getRowCol(text, 11);       // [1, 5] - position after 'd'
 * 
 * getRowCol(text, 6, true);  // "2:1" - 'w' at row 2, col 1 (1-based)
 * ```
 */
export function getRowCol(s: string, ind: number, pretty?: false): RowCol;
export function getRowCol(s: string, ind: number, pretty: true): `${number}:${number}`;
export function getRowCol(s: string, ind: number, pretty: boolean = false): RowCol|`${number}:${number}` {
    if (ind < 0 || ind > s.length) {
        throw new RangeError(`Index ${ind} out of bounds [0, ${s.length}]`);
    }

    let row_no = 0;
    let row_start = 0;

    for(let i=0; i<s.length && i<ind; ++i) {
        if(s[i] === '\n') {
            ++row_no;
            row_start = i+1;
        }
    }

    const col_no = ind - row_start;

    if(pretty) {
        return `${row_no+1}:${col_no+1}`;
    } else {
        return [row_no, col_no];
    }
}
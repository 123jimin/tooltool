/** A tuple of `[row, col]` (0-indexed). */
export type RowCol = [row: number, col: number];

/**
 * Calculates the row and column of a character index in a string.
 *
 * @param s - The string.
 * @param ind - Zero-based character index (`s.length` returns position after last char).
 * @param pretty - If `true`, returns 1-based `"row:col"`; otherwise 0-based tuple.
 * @returns `[row, col]` tuple or `"row:col"` string.
 * @throws {RangeError} If `ind` is out of bounds.
 *
 * @remarks
 * Line breaks are `\n` only; `\r` is treated as a regular character.
 *
 * @example
 * ```ts
 * const text = "hello\nworld";
 * getRowCol(text, 0);       // [0, 0]
 * getRowCol(text, 6);       // [1, 0]
 * getRowCol(text, 6, true); // "2:1"
 * ```
 */
export function getRowCol(s: string, ind: number, pretty?: false): RowCol;
export function getRowCol(s: string, ind: number, pretty: true): `${number}:${number}`;
export function getRowCol(s: string, ind: number, pretty: boolean = false): RowCol|`${number}:${number}` {
    if(ind < 0 || ind > s.length) {
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

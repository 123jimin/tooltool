export type RowCol = [row: number, col: number];

/**
 * Get the row and column of a character in a string.
 * @param s The target string.
 * @param ind The index of the character (zero-based); `0 <= ind && ind <= s.length` must be true.
 * @param pretty If true, return a string in the format "row:col" (intended for human reading, starting from 1). Otherwise, return a tuple [row, col] (starting from 0).
 * @returns The row and column of the character.
 */
export function getRowCol(s: string, ind: number, pretty?: false): RowCol;
export function getRowCol(s: string, ind: number, pretty: true): `${number}:${number}`;
export function getRowCol(s: string, ind: number, pretty: boolean = false): RowCol|`${number}:${number}` {
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
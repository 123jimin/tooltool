import type {Nullable, Nullish} from "../type/index.ts";

/**
 * Returns the substring after the first occurrence of the delimiter.
 *
 * @param s - Input string, or `null`/`undefined`.
 * @param delimiter - String or regex marking where to start.
 * @param on_missing - Returned if `s` is nullish or delimiter not found (default: `null`).
 * @returns The substring after the delimiter (may be empty string), or `on_missing`.
 *
 * @remarks
 * If the delimiter is found at the end of the string, an empty string is returned
 * (not `on_missing`).
 *
 * @example
 * ```ts
 * substringAfter("path/to/file.txt", '/');     // "to/file.txt"
 * substringAfter("abc123xyz", /\d+/);          // "xyz"
 * substringAfter("abc123", /\d+/);             // "" (empty string)
 * substringAfter(undefined, ':');              // null
 * substringAfter("no-needle", ':', 'default'); // 'default'
 * ```
 */
export function substringAfter<T extends string|null = null>(s: Nullish, delimiter: string|RegExp, on_missing?: T): T;
export function substringAfter<T extends string|null = null>(s: Nullable<string>, delimiter: string|RegExp, on_missing?: T): string|T;
export function substringAfter<T extends string|null = null>(s: Nullable<string>, delimiter: string|RegExp, on_missing: T = null as T): string|T {
    if(s == null) return on_missing;

    if(typeof delimiter === 'string') {
        const ind = s.indexOf(delimiter);
        if(ind < 0) return on_missing;
        return s.slice(ind + delimiter.length);
    } else {
        const match = s.match(delimiter);
        if(match?.index == null) return on_missing;
        return s.slice(match.index + match[0].length);
    }
}

/**
 * Returns the substring before the first occurrence of the delimiter.
 *
 * @param s - Input string, or `null`/`undefined`.
 * @param delimiter - String or regex marking where to end.
 * @param on_missing - Returned if `s` is nullish or delimiter not found (default: `null`).
 * @returns The substring before the delimiter, or `on_missing`.
 *
 * @example
 * ```ts
 * substringBefore("path/to/file.txt", '/');     // "path"
 * substringBefore("abc123xyz", /\d+/);          // "abc"
 * substringBefore(undefined, ':');              // null
 * substringBefore("no-needle", ':', 'default'); // 'default'
 * ```
 */
export function substringBefore<T extends string|null = null>(s: Nullish, delimiter: string|RegExp, on_missing?: T): T;
export function substringBefore<T extends string|null = null>(s: Nullable<string>, delimiter: string|RegExp, on_missing?: T): string|T;
export function substringBefore<T extends string|null = null>(s: Nullable<string>, delimiter: string|RegExp, on_missing: T = null as T): string|T {
    if(s == null) return on_missing;

    if(typeof delimiter === 'string') {
        const ind = s.indexOf(delimiter);
        if(ind < 0) return on_missing;
        return s.slice(0, ind);
    } else {
        const match = s.match(delimiter);
        if(match?.index == null) return on_missing;
        return s.slice(0, match.index);
    }
}

/**
 * Returns the substring between the first `start` and the first `end` after it.
 *
 * @param s - Input string, or `null`/`undefined`.
 * @param start - String or regex marking where to start.
 * @param end - String or regex marking where to end.
 * @param on_missing - Returned if `s` is nullish or delimiters not found (default: `null`).
 * @returns The substring between delimiters, or `on_missing`.
 *
 * @remarks
 * Search for `end` begins after `start`. Occurrences of `end` before `start` are ignored.
 *
 * @example
 * ```ts
 * substringBetween("<a>b</a>", "<a>", "</a>");     // "b"
 * substringBetween("yabbadabbadoo", "abba", "doo"); // "dabba"
 * substringBetween("<a>b", "<a>", "</a>");         // null
 * ```
 */
export function substringBetween<T extends string|null = null>(s: Nullish, start: string|RegExp, end: string|RegExp, on_missing?: T): T;
export function substringBetween<T extends string|null = null>(s: Nullable<string>, start: string|RegExp, end: string|RegExp, on_missing?: T): string|T;
export function substringBetween<T extends string|null = null>(s: Nullable<string>, start: string|RegExp, end: string|RegExp, on_missing: T = null as T): string|T {
    const after_start = substringAfter(s, start);
    if(after_start === null) {
        return on_missing;
    }
    return substringBefore(after_start, end, on_missing);
}

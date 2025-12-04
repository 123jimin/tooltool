import type { Nullable, Nullish } from "../type/index.ts";

/**
 * Returns the substring after the first occurrence of the delimiter.
 *
 * @param s - String (or `null`/`undefined`) to find the substring of.
 * @param delimiter - Needle that marks where the cropped string should start.
 * @param on_missing - Value to return when `s` is nullish or delimiter is not found (defaults to `null`).
 *
 * @returns
 * - The substring that follows the first occurrence of `delimiter`.
 * - `on_missing` if `s` is `null`/`undefined` or if the delimiter cannot be found.
 *
 * @example
 * ```ts
 * substringAfter("path/to/file.txt", '/');       // "to/file.txt"
 * substringAfter("abc123", /\d+/);               // ''
 * substringAfter("abc123xyz", /\d+/);            // "xyz"
 * substringAfter(undefined, ':');                // null
 * substringAfter("no-needle", ':');              // null
 * substringAfter("no-needle", ':', 'default');   // 'default'
 * substringAfter(null, ':', '');                 // ''
 * ```
 */
export function substringAfter<T extends string|null = null>(s: Nullish,          delimiter: string|RegExp, on_missing?: T): T;
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
 * @param s - String (or `null`/`undefined`) to find the substring of.
 * @param delimiter - Needle that marks where the cropped string should end.
 * @param on_missing - Value to return when `s` is nullish or delimiter is not found (defaults to `null`).
 *
 * @returns
 * - The substring that precedes the first occurrence of `delimiter`.
 * - `on_missing` if `s` is `null`/`undefined` or if the delimiter cannot be found.
 *
 * @example
 * ```ts
 * substringBefore("path/to/file.txt", '/');       // "path"
 * substringBefore("abc123xyz", /\d+/);            // "abc"
 * substringBefore(undefined, ':');                // null
 * substringBefore("no-needle", ':');              // null
 * substringBefore("no-needle", ':', 'default');   // 'default'
 * substringBefore(null, ':', '');                 // ''
 * ```
 */
export function substringBefore<T extends string|null = null>(s: Nullish,          delimiter: string|RegExp, on_missing?: T): T;
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
 * Returns the substring between the first `start` and the first `end` that follows it.
 *
 * @param s - String (or `null`/`undefined`) to find the substring of.
 * @param start - Needle that marks where the cropped string should start.
 * @param end - Needle that marks where the cropped string should end.
 * @param on_missing - Value to return when `s` is nullish or delimiters are not found (defaults to `null`).
 *
 * @returns
 * - The substring between the first occurrence of `start` and the subsequent first occurrence of `end`.
 * - `on_missing` if `s` is `null`/`undefined` or if the delimiters cannot be found in order.
 *
 * @remarks
 * The search for `end` begins after the first `start` is found. Any occurrence of `end` before the first `start` is ignored.
 *
 * @example
 * ```ts
 * substringBetween("<a>b</a>", "<a>", "</a>");       // "b"
 * substringBetween("<a><b></a>", "<a>", "</a>");     // "<b>"
 * substringBetween("yabbadabbadoo", "abba", "doo"); // "dabba"
 * substringBetween("a1b2a", "b", "a");              // "2"
 * substringBetween("<a>b", "<a>", "</a>");           // null
 * substringBetween("ab</a>", "<a>", "</a>");         // null
 * substringBetween(undefined, "<a>", "</a>");        // null
 * substringBetween("<a>b</a>", "<c>", "</c>", "");   // ""
 * ```
 */
export function substringBetween<T extends string|null = null>(s: Nullish,          start: string|RegExp, end: string|RegExp, on_missing?: T): T;
export function substringBetween<T extends string|null = null>(s: Nullable<string>, start: string|RegExp, end: string|RegExp, on_missing?: T): string|T;
export function substringBetween<T extends string|null = null>(s: Nullable<string>, start: string|RegExp, end: string|RegExp, on_missing: T = null as T): string|T {
    const after_start = substringAfter(s, start);
    if (after_start === null) {
        return on_missing;
    }
    return substringBefore(after_start, end, on_missing);
}
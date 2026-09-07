import type {Nullable, Nullish} from "../type/index.ts";

/**
 * Returns the substring after the first occurrence of the delimiter.
 *
 * @param s - Input string, `null`, or `undefined`.
 * @param delimiter - String or regex marking where to start.
 * @param on_missing - Returned if `s` is nullish or delimiter not found (default: `null`).
 * @returns The substring after the delimiter (may be empty string), or `on_missing`.
 *
 * @remarks
 * A delimiter at the end returns an empty string, not `on_missing`; an empty delimiter
 * returns all of `s`. Useful for removing a path, field, or protocol prefix.
 * Regex flags are preserved; matching starts at zero without reading or changing the
 * caller's `lastIndex`. Global regexes use the first match; sticky regexes must match at zero.
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
        return ind < 0 ? on_missing : s.slice(ind + delimiter.length);
    }

    const match = new RegExp(delimiter.source, delimiter.flags).exec(s);
    return match == null ? on_missing : s.slice(match.index + match[0].length);
}

/**
 * Returns the substring before the first occurrence of the delimiter.
 *
 * @param s - Input string, `null`, or `undefined`.
 * @param delimiter - String or regex marking where to end.
 * @param on_missing - Returned if `s` is nullish or delimiter not found (default: `null`).
 * @returns The substring before the delimiter, or `on_missing`.
 *
 * @remarks
 * A delimiter at the beginning, including an empty string delimiter, returns an
 * empty string rather than `on_missing`. Useful for extracting a path or field prefix.
 * Regex flags are preserved; matching starts at zero without reading or changing the
 * caller's `lastIndex`. Global regexes use the first match; sticky regexes must match at zero.
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
        return ind < 0 ? on_missing : s.slice(0, ind);
    }

    const match = new RegExp(delimiter.source, delimiter.flags).exec(s);
    return match == null ? on_missing : s.slice(0, match.index);
}

/**
 * Returns the substring between the first `start` and the first `end` after it.
 *
 * @param s - Input string, `null`, or `undefined`.
 * @param start - String or regex marking where to start.
 * @param end - String or regex marking where to end.
 * @param on_missing - Returned if `s` is nullish or delimiters not found (default: `null`).
 * @returns The substring between delimiters, or `on_missing`.
 *
 * @remarks
 * Search for `end` begins after `start`. Occurrences of `end` before `start` are ignored.
 * An `end` regex runs against the remaining substring, so `^` anchors immediately
 * after `start`. Adjacent delimiters return an empty string rather than `on_missing`.
 * Regex flags are preserved and caller `lastIndex` values are neither read nor changed.
 * Each regex starts at zero in its searched substring; sticky regexes must match there.
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
    return after_start === null ? on_missing : substringBefore(after_start, end, on_missing);
}

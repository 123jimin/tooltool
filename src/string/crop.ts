import type { Nullable, Nullish } from "../type/index.js";

/**
 * Crop the left side of a string, from the beginning to the end of the first occurrence of the needle.
 * @param s String to crop.
 * @param start Needle to crop to.
 * @returns Cropped string, or null if the needle is not found. The result does not include the needle. 
 */
export function cropBefore(s: Nullish, start: string|RegExp): null;
export function cropBefore(s: Nullable<string>, start: string|RegExp): string|null;
export function cropBefore(s: Nullable<string>, start: string|RegExp): string|null {
    if(s == null) return null;

    if(typeof start === 'string') {
        const ind = s.indexOf(start);
        if(ind < 0) return null;
        return s.slice(ind + start.length);
    } else {
        const match = s.match(start);
        if(match?.index == null) return null;
        return s.slice(match.index + match[0].length);
    }
}

/**
 * Crop the right side of a string, from the first occurrence of the needle to the end.
 * @param s String to crop.
 * @param end Needle to crop from.
 * @returns Cropped string, or null if the needle is not found. The result does not include the needle.
 */
export function cropAfter(s: Nullish, end: string|RegExp): null;
export function cropAfter(s: Nullable<string>, start: string|RegExp): string|null;
export function cropAfter(s: Nullable<string>, end: string|RegExp): string|null {
    if(s == null) return null;

    if(typeof end === 'string') {
        const ind = s.indexOf(end);
        if(ind < 0) return null;
        return s.slice(0, ind);
    } else {
        const match = s.match(end);
        if(match?.index == null) return null;
        return s.slice(0, match.index);
    }
}

/**
 * Crop a string from the first occurrence of the start needle to the first occurrence of the end needle.
 * @param s String to crop.
 * @param start Needle to crop to.
 * @param end Needle to crop from.
 * @returns Cropped string, or null if either needle is not found. The result does not include the needles.
 */
export function cropString(s: Nullish, start: string|RegExp, end: string|RegExp): null;
export function cropString(s: Nullable<string>, start: string|RegExp, end: string|RegExp): string|null;
export function cropString(s: Nullable<string>, start: string|RegExp, end: string|RegExp): string|null {
    return cropAfter(cropBefore(s, start), end);
}
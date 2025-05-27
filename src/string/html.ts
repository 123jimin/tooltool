import { escapeRegExp } from "./regex.js";

/**
 * Generate a regular expression source string for matching an HTML tag with a specific attribute.
 * 
 * @param tag Tag name.
 * @param name Name of the attribute.
 * @param value Value of the attribute.
 * @returns Regular expression source string for matching the tag.
 */
export function htmlAttrNeedleSrc(tag: string, name: string, value: string|RegExp): string {
    if(typeof value === 'string') {
        value = `[^'">]*\\b${escapeRegExp(value)}\\b[^'">]*`;
    } else {
        value = value.source;
    }
    
    return `<${tag}\\b[^>]*\\b${name}\\s*=\\s*['"]${value}['"][^>]*>`;
}

/**
 * Generate a regular expression for matching an HTML tag with a specific attribute.
 * @param tag Tag name.
 * @param name Name of the attribute.
 * @param value Value of the attribute.
 * @returns Regular expression for matching the tag.
 */
export function htmlAttrNeedle(tag: string, name: string, value: string|RegExp): RegExp {
    return new RegExp(htmlAttrNeedleSrc(tag, name, value), 'i');
}

/**
 * Generate a regular expression source string for matching an HTML tag with a specific ID.
 * @param tag Tag name.
 * @param id ID of the tag.
 * @returns Regular expression source string for matching the tag.
 */
export function htmlIdNeedleSrc(tag: string, id: string|RegExp): string {
    return htmlAttrNeedleSrc(tag, 'id', id);
}

/**
 * Generate a regular expression for matching an HTML tag with a specific ID.
 * @param tag Tag name.
 * @param id ID of the tag.
 * @returns Regular expression for matching the tag.
 */
export function htmlIdNeedle(tag: string, id: string|RegExp): RegExp {
    return htmlAttrNeedle(tag, 'id', id);
}

/**
 * Generate a regular expression source string for matching an HTML tag with a specific class.
 * @param tag Tag name.
 * @param class_name Class name.
 * @returns Regular expression source string for matching the tag.
 */
export function htmlClassNeedleSrc(tag: string, class_name: string|RegExp): string {
    return htmlAttrNeedleSrc(tag, 'class', class_name);
}

/**
 * Generate a regular expression for matching an HTML tag with a specific class.
 * @param tag Tag name.
 * @param class_name Class name.
 * @returns Regular expression for matching the tag.
 */
export function htmlClassNeedle(tag: string, class_name: string|RegExp): RegExp {
    return htmlAttrNeedle(tag, 'class', class_name);
}

/**
 * Generate a regular expression source string for matching an HTML close tag.
 * @param tag Tag name.
 * @returns Regular expression source string for matching the closing tag.
 */
export function htmlCloseTagNeedleSrc(tag: string): string {
    return `<\\s*/${tag}\\b[^>]*>`;
}

/**
 * Generate a regular expression for matching an HTML close tag.
 * @param tag Tag name.
 * @returns Regular expression for matching the closing tag.
 */
export function htmlCloseTagNeedle(tag: string): RegExp {
    return new RegExp(htmlCloseTagNeedleSrc(tag), 'i');
}
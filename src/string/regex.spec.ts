import { assert } from "chai";

import { escapeRegExp, REGEX_SRC_UUID, REGEX_UUID } from "./regex.ts";

describe("string/regex", () => {
    describe("REGEX_SRC_UUID", () => {
        it("should work as advertised", () => {
            const pattern = new RegExp(`id:\\s*(${REGEX_SRC_UUID})`, 'i');
            const match = pattern.exec('id: 550e8400-e29b-41d4-a716-446655440000');
            assert.strictEqual(match?.[1], '550e8400-e29b-41d4-a716-446655440000');
        });

        it("should match uppercase UUIDs with case-insensitive flag", () => {
            const pattern = new RegExp(REGEX_SRC_UUID, 'i');
            assert.strictEqual(pattern.test('550E8400-E29B-41D4-A716-446655440000'), true);
        });

        it("should match lowercase UUIDs with case-insensitive flag", () => {
            const pattern = new RegExp(REGEX_SRC_UUID, 'i');
            assert.strictEqual(pattern.test('550e8400-e29b-41d4-a716-446655440000'), true);
        });

        it("should match mixed-case UUIDs with case-insensitive flag", () => {
            const pattern = new RegExp(REGEX_SRC_UUID, 'i');
            assert.strictEqual(pattern.test('550E8400-e29b-41D4-a716-446655440000'), true);
        });

        it("should not be anchored", () => {
            const pattern = new RegExp(REGEX_SRC_UUID, 'i');
            assert.strictEqual(pattern.test('prefix-550e8400-e29b-41d4-a716-446655440000-suffix'), true);
        });
    });

    describe("REGEX_UUID", () => {
        it("should work as advertised", () => {
            assert.strictEqual(REGEX_UUID.test('550e8400-e29b-41d4-a716-446655440000'), true);
            assert.strictEqual(REGEX_UUID.test('not-a-uuid'), false);
        });

        it("should match valid uppercase UUIDs", () => {
            assert.strictEqual(REGEX_UUID.test('550E8400-E29B-41D4-A716-446655440000'), true);
        });

        it("should match valid lowercase UUIDs", () => {
            assert.strictEqual(REGEX_UUID.test('550e8400-e29b-41d4-a716-446655440000'), true);
        });

        it("should reject UUIDs with wrong segment lengths", () => {
            assert.strictEqual(REGEX_UUID.test('550e840-e29b-41d4-a716-446655440000'), false);
            assert.strictEqual(REGEX_UUID.test('550e8400-e29-41d4-a716-446655440000'), false);
            assert.strictEqual(REGEX_UUID.test('550e8400-e29b-41d-a716-446655440000'), false);
            assert.strictEqual(REGEX_UUID.test('550e8400-e29b-41d4-a71-446655440000'), false);
            assert.strictEqual(REGEX_UUID.test('550e8400-e29b-41d4-a716-44665544000'), false);
        });

        it("should reject UUIDs with invalid characters", () => {
            assert.strictEqual(REGEX_UUID.test('550g8400-e29b-41d4-a716-446655440000'), false);
            assert.strictEqual(REGEX_UUID.test('550e8400-e29b-41d4-a716-44665544000z'), false);
        });

        it("should reject UUIDs with missing dashes", () => {
            assert.strictEqual(REGEX_UUID.test('550e8400e29b41d4a716446655440000'), false);
        });

        it("should reject UUIDs with extra content", () => {
            assert.strictEqual(REGEX_UUID.test('prefix-550e8400-e29b-41d4-a716-446655440000'), false);
            assert.strictEqual(REGEX_UUID.test('550e8400-e29b-41d4-a716-446655440000-suffix'), false);
        });

        it("should reject empty strings", () => {
            assert.strictEqual(REGEX_UUID.test(''), false);
        });
    });

    describe("escapeRegExp", () => {
        it("should work as advertised", () => {
            assert.strictEqual(new RegExp(escapeRegExp('example.com')).test('example.com'), true);
            assert.strictEqual(new RegExp(escapeRegExp('example.com')).test('exampleXcom'), false);
        });

        it("should escape dots", () => {
            assert.strictEqual(escapeRegExp('.'), '\\.');
        });

        it("should escape asterisks", () => {
            assert.strictEqual(escapeRegExp('*'), '\\*');
        });

        it("should escape plus signs", () => {
            assert.strictEqual(escapeRegExp('+'), '\\+');
        });

        it("should escape question marks", () => {
            assert.strictEqual(escapeRegExp('?'), '\\?');
        });

        it("should escape caret", () => {
            assert.strictEqual(escapeRegExp('^'), '\\^');
        });

        it("should escape dollar sign", () => {
            assert.strictEqual(escapeRegExp('$'), '\\$');
        });

        it("should escape curly braces", () => {
            assert.strictEqual(escapeRegExp('{}'), '\\{\\}');
        });

        it("should escape parentheses", () => {
            assert.strictEqual(escapeRegExp('()'), '\\(\\)');
        });

        it("should escape pipe", () => {
            assert.strictEqual(escapeRegExp('|'), '\\|');
        });

        it("should escape square brackets", () => {
            assert.strictEqual(escapeRegExp('[]'), '\\[\\]');
        });

        it("should escape backslash", () => {
            assert.strictEqual(escapeRegExp('\\'), '\\\\');
        });

        it("should escape multiple special characters in sequence", () => {
            assert.strictEqual(escapeRegExp('a.b*c?d'), 'a\\.b\\*c\\?d');
        });

        it("should return empty string for empty input", () => {
            assert.strictEqual(escapeRegExp(''), '');
        });

        it("should not modify strings without special characters", () => {
            assert.strictEqual(escapeRegExp('hello world'), 'hello world');
        });

        it("should produce patterns that match literal strings", () => {
            const special = 'file[1].txt (copy)';
            const pattern = new RegExp(`^${escapeRegExp(special)}$`);
            assert.strictEqual(pattern.test(special), true);
            assert.strictEqual(pattern.test('file1.txt copy'), false);
        });
    });
});

import {assert} from "chai";

import {escapeRegExp, REGEX_SRC_UUID, REGEX_UUID} from "./regex.ts";

describe("string/regex", () => {
    describe("REGEX_SRC_UUID", () => {
        it("should work as advertised", () => {
            const pattern = new RegExp(`id:\\s*(${REGEX_SRC_UUID})`, 'i');
            const match = pattern.exec('id: 550e8400-e29b-41d4-a716-446655440000');
            assert.strictEqual(match?.[1], '550e8400-e29b-41d4-a716-446655440000');
        });

        it("requires the case-insensitive flag for lowercase hexadecimal", () => {
            const pattern = new RegExp(REGEX_SRC_UUID);
            assert.strictEqual(pattern.test("550E8400-E29B-41D4-A716-446655440000"), true);
            assert.strictEqual(pattern.test("550E8400-e29b-41D4-a716-446655440000"), false);
            assert.strictEqual(new RegExp(REGEX_SRC_UUID, "i").test("550E8400-e29b-41D4-a716-446655440000"), true);
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

        it("matches metacharacters literally in a larger pattern", () => {
            const literal = `a.b*c+d?^\${e}(f)|[g]\\h`;
            const pattern = new RegExp(`^prefix:${escapeRegExp(literal)}:suffix$`, "u");
            assert.strictEqual(pattern.test(`prefix:${literal}:suffix`), true);
            assert.strictEqual(pattern.test(`prefix:aXb*c+d?^\${e}(f)|[g]\\h:suffix`), false);
            assert.strictEqual(pattern.test(`prefix:a.b*c+d?^\${e}(f)|g\\h:suffix`), false);
        });

        it("supports empty and plain literal patterns", () => {
            const empty_pattern = new RegExp(`^${escapeRegExp("")}$`, "u");
            assert.strictEqual(empty_pattern.test(""), true);
            assert.strictEqual(empty_pattern.test("a"), false);

            const literal = "/a-b,\n\u{1D11E}";
            const pattern = new RegExp(`^${escapeRegExp(literal)}$`, "u");
            assert.strictEqual(pattern.test(literal), true);
            assert.strictEqual(pattern.test("/a-b,\nother"), false);
        });
    });
});

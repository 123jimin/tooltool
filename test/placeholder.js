// @ts-check

import { assert } from 'chai';
import { PLACEHOLDER } from "../dist/index.js";

describe("PLACEHOLDER", function() {
    it("should be equal to 42", function() {
        assert.strictEqual(PLACEHOLDER, 42);
    });
});
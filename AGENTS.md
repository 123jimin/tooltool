# tooltool

tooltool is a dependency-free collection of TypeScript utilities for Node.js and modern browsers.

## Summary

### Tech Stacks

(TODO: tech stacks tooltool utilizes)

- Language:
- Package Manager:
- Testing:
- Documentation:
- CI:

### File Structure

(TODO: file structures)

`src/index.ts` re-exports domain-specific modules.

- `src/data-structure/`:

Unit tests live beside their source modules as `.spec.ts` files and run from the compiled `dist/**/*.spec.js`.

## Testing

When creating a new spec file, use the following template:

```ts
import { assert } from "chai";
import { someUtility } from "./module.js";

describe("module-name/file-name", () => {
    describe("someUtility", () => {
        it("describes the behavior", () => {
            const result = someUtility();
            assert.strictEqual(result, 42);
        });
    });
});
```

- Use `context` if applicable.
- Always use strict equality for comparison.

## Coding Style

(TODO: important coding styles including TS strictness and naming conventions)
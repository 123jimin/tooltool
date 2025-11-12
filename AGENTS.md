# tooltool

tooltool is a dependency-free collection of TypeScript utilities for Node.js and modern browsers.

## Summary

### Tech Stacks

- Language: TypeScript 5.9, ES2024, targeting Node.js and modern browsers.
- Package Manager: `pnpm`; use `pnpm test` for build+test.
- Testing: Mocha + Chai assertions.
- Linting: ESLint 9 with `typescript-eslint` strict config.
- Documentation: TypeDoc (`pnpm build-docs`).

### File Structure

- `src/index.ts` re-exports the public surface of each domain package. Update this file whenever you add a new top-level utility.
  - `src/data-structure/`
  - `src/function/`
  - `src/iterator/`
  - `src/math/`
  - `src/string/`
  - `src/type/`

## Testing

Unit tests are written to `src/**/*.spec.ts` and transpiled to `dist/**/*.spec.js`, which gets executed.

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

### Naming

- `snake_case` for variables
- `camelCase` for functions (including variables with function types)
- `PascalCase` for classes and types
- `kebab-case` for file names.
- Prefer short names that are self-descriptive.

### TypeScript

- Strictness should be enforced; `any` is not allowed under any circumstances.
- Nullish values:
  - For values *to* users, `null` is preferred over `undefined`.
  - For values *from* users, use `Nullish` and `Nullable<T>`. Use `x == null` for whether a value is nullish.
- JSDoc should be comprehensive and easy-to-read, but avoid verbose or repetitive descriptions.

### Architecture

- Prefer free, modular functions with composition over classes and inheritance.
# Instructions for Working on This Codebase

This codebase is the repository for the `tooltool` library.

## Summary

tooltool is a dependency-free collection of TypeScript utilities for Node.js and modern browsers.

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
import { someUtility } from "./module.ts";

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
- Test cases should be based on JSDoc and function signature, and not body code (actual implementation).
- Titles for tests should be enclosed within double quotes (`""`), not single quotes (`''`).
- If the function to test has attached examples via JSDoc, put those as the first test: `it("should work as advertised", () => { ... })` 

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
- JSDoc:
  - It should be comprehensive and easy-to-read, but avoid verbose or repetitive descriptions.
  - Try including following information:
    - Example use-cases.
    - Potential gotchas (if applicable), via `@remarks`.
    - Example codes, using `@example`. Keep example codes short yet diverse.
  - Formatting rules:
    - Omit types in `@param` and `@returns` tags; rely on TypeScript inference.
    - Use fenced code blocks with `ts` language tag for `@example`.
    - Keep `@returns` descriptions brief (one line when possible).
    - Use `@typeParam` with a dash before the description: `@typeParam T - Description`.
    - Document exceptions with `@throws {ErrorType}` when applicable.
    - Use `@see {@link otherFunction}` to reference related utilities.
  - Nullish terminology:
    - Spell out `` `null` or `undefined` `` when describing input parameter types.
    - Use "nullish" when describing operations or conditions (e.g., "returns `on_missing` if `s` is nullish").
  - Style:
    - Start with a single-line summary (imperative verb preferred: "Creates...", "Returns...", "Applies...").
    - Use backticks for inline code, types, and parameter references.
    - Avoid redundant phrases like "This function..." or "A promise that resolves to...".

### Architecture

- Prefer free, modular functions with composition over classes and inheritance.
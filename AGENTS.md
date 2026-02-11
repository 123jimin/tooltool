# tooltool

Dependency-free TypeScript utilities for Node.js and modern browsers.

## Stack

- TypeScript 5.9, ES2024 | `pnpm test` (build+test) | Mocha+Chai | ESLint 9 strict | TypeDoc (`pnpm build-docs`)

## Structure

`src/index.ts` re-exports all utilities. Update when adding new ones.

Domains (under `src/`): `data-structure/`, `function/`, `iterator/`, `math/`, `string/`, `type/`

## Testing

Tests: `src/**/*.spec.ts`, transpiled to `dist/**/*.spec.js` (executed)

```ts
import { assert } from "chai";
import { someUtility } from "./module.ts";

describe("module-name/file-name", () => {
    describe("someUtility", () => {
        it("describes the behavior", () => {
            assert.strictEqual(someUtility(), 42);
        });
    });
});
```

- Use `context` blocks to group related cases
- Always use `assert.strictEqual`, not `assert.equal`
- Test against JSDoc/signature, not implementation
- Double quotes for test titles
- JSDoc examples → first test: `it("should work as advertised", ...)`

## Style

### Naming

`snake_case` variables | `camelCase` functions | `PascalCase` types | `kebab-case` files

### TypeScript

- No `any` ever
- Nullish: return `null` (not `undefined`); accept user input with types `Nullish`/`Nullable<T>`; check with `x == null`
- Prefer free functions + composition over classes
- No top-level side effects — the package is `sideEffects: false` (tree-shakeable)

### JSDoc

Concise but comprehensive. Include: use-cases, gotchas (`@remarks`), examples (`@example` with `` ```ts ``).

Formatting:
- Omit types in `@param`/`@returns` (use inference)
- Format: `@typeParam T - Desc`, `@throws {ErrorType}`, `@see {@link fn}`
- Brief `@returns` (one line)
- Start with imperative verb ("Creates...", "Returns...")
- Backticks for code/params; no "This function..."
- Describing input params: spell out `` `null` or `undefined` ``; describing behavior/conditions: use "nullish"
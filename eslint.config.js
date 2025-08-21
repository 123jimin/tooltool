// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

const config = tseslint.config([
    {
        ignores: ["dist/**"],
    },
    eslint.configs.recommended,
    tseslint.configs.strict,
    {
        files: ["src/**/*.{ts}"],
    },
]);

export default config;
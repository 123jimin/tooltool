// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

import local_strict from "./strict.mjs";
import local_style from "./style.mjs";

import {defineConfig} from "eslint/config";

/** @type {import('eslint').Linter.Config[]} */
export default defineConfig(
    {
        ignores: ["dist/**"],
    },
    {
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
        },
    },
    eslint.configs.recommended,
    tseslint.configs.recommended,
    local_strict,
    local_style,
    {
        // Miscellaneous configs
        name: "jiminp/misc",
        rules: {
            "@typescript-eslint/no-unused-vars": ["error", {varsIgnorePattern: "^_", argsIgnorePattern: "^_"}],
        },
    },
);

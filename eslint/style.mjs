// @ts-check

import stylistic from "@stylistic/eslint-plugin";

/** @type {import('eslint').Linter.RulesRecord} */
const rules = {
    // Spacing
    "@stylistic/block-spacing": "off", // Causes problem with TypeScript types.
    "@stylistic/keyword-spacing": ["error", {
        before: true, after: true, overrides: {
            "async": {after: true},
            "catch": {after: false},
            "for": {after: false},
            "if": {after: false},
            "switch": {after: false},
            "while": {after: false},
        },
    }],
    "@stylistic/object-curly-spacing": ["error", "never"],
    "@stylistic/space-infix-ops": "off",
    "@stylistic/yield-star-spacing": ["error", {before: false, after: true}],

    // Line breaks

    // Brackets
    "@stylistic/arrow-parens": ["error", "always"],

    // Indent

    // Quotes
    "@stylistic/jsx-quotes": ["error", "prefer-double"],
    "@stylistic/quote-props": ["error", "consistent-as-needed", {keywords: true, numbers: true}],
    "@stylistic/quotes": ["off"],

    // Commas

    // Semis

    // Operators
    "@stylistic/operator-linebreak": ["error", "before", {
        overrides: {
            "=": "after",
        },
    }],

    // Comments

    // JSX
    "@stylistic/jsx-one-expression-per-line": ["off", {allow: "single-line"}],

    // Types
    "@stylistic/type-annotation-spacing": "error",

    // Misc.
    "@stylistic/max-statements-per-line": ["error", {max: 2}],
};

/** @type {import('eslint').Linter.Config[]} */
export default [
    /** @type {import('eslint').Linter.Config} */ (stylistic.configs.customize({
        indent: 4,
        semi: true,
        arrowParens: true,
        braceStyle: '1tbs',
    })),
    {
        name: "jiminp/style",
        plugins: {
            "@stylistic": stylistic,
        },
        rules,
    },
];

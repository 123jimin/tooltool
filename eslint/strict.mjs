// @ts-check

// Rules follow order from <https://eslint.org/docs/latest/rules/>.

/** @type {import('eslint').Linter.Config} */
export default {
    // Enable stricter checks (less strict than enabling all rules)
    name: "jiminp/strict",
    rules: {
        // Enable "Possible Problems" rules that are not enabled by `eslint.configs.recommended`.
        "array-callback-return": "error",
        "no-await-in-loop": "off", // More often a false positive.
        "no-constructor-return": "error",
        "no-duplicate-imports": ["error", {allowSeparateTypeImports: true}],
        "no-inner-declarations": "error",
        "no-promise-executor-return": "error",
        "no-self-compare": "error",
        "no-template-curly-in-string": "error",
        "no-unmodified-loop-condition": "error",
        "no-unreachable-loop": "error",
        "no-use-before-define": ["error", {functions: false}],
        "require-atomic-updates": "error",

        // Enable some useful "Suggestions".
        "consistent-return": "error",
        "consistent-this": ["error", "self"],
        "default-case-last": "error",
        "default-param-last": "error",
        "eqeqeq": ["error", "smart"],
        "guard-for-in": "error",
        "new-cap": ["error", {capIsNewExceptions: ["Immutable.List", "Immutable.Map"]}],
        "no-alert": "error",
        "no-array-constructor": "error",
        "no-caller": "error",
        "no-new-wrappers": "error",
        "no-octal-escape": "error",
        "no-script-url": "error",
        "no-sequences": "error",
        "no-undefined": "error",
        "no-var": "error",
        "prefer-arrow-callback": "error",
    },
};

import js from "@eslint/js";
import stylistic from '@stylistic/eslint-plugin'
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: {
      js: js,
      '@stylistic': stylistic },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.jest,
      },
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
  },
  ...tseslint.configs.strict,
  {
    files: ["**/*.{ts,mts,cts}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", {
        "vars": "all",
        "args": "after-used",
        "caughtErrorsIgnorePattern": '^_',
        "ignoreRestSiblings": true
      }],
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/explicit-member-accessibility": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-inferrable-types": "error",
      "@typescript-eslint/no-empty-interface": "error",
      //"@typescript-eslint/no-unsafe-assignment": "error",
      //"@typescript-eslint/no-unsafe-call": "error",
      //"@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/strict-boolean-expressions": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/restrict-template-expressions": ["error", { "allowNumber": true }],
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      //"@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/no-unnecessary-condition": "error",
      "@typescript-eslint/naming-convention": [
        "error",
        {
          "selector": "memberLike",
          "modifiers": ["private"],
          "format": ["camelCase"],
          "leadingUnderscore": "require"
        }
      ],

      "prefer-const": "error",
      "no-var": "error",
      "eqeqeq": ["error", "always"],
      "curly": ["error", "multi-line", "consistent"],
      "no-else-return": "error",
      "no-extra-boolean-cast": "error",
      "@typescript-eslint/no-unnecessary-boolean-literal-compare": "error",
      "nonblock-statement-body-position": ["error", "beside"],
      "brace-style": ["error", "stroustrup"],
      "no-trailing-spaces": ["error", { "skipBlankLines": false }],

      "@stylistic/semi": ["error", "always"],
      "@stylistic/quotes": ["error", "single"],
      "@stylistic/indent": ["error", 2],
      "@stylistic/object-curly-spacing": ["error", "always"],
      "@stylistic/comma-dangle": ["error", "never"],
      "@stylistic/space-before-blocks": ["error", "always"]
    },
  },
  {
    ignores: [
      "dist/",
      "node_modules/",
      "*.js",
      "*.d.ts",
      "*.config.ts",
      "*.config.js",
    ],
  },
]);

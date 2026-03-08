/* eslint-env node */
"use strict";

module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  plugins: ["@typescript-eslint", "import"],
  extends: [
    "airbnb-base",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "prettier",
  ],
  settings: {
    "import/resolver": {
      typescript: { alwaysTryTypes: true },
      node: true,
    },
  },
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      rules: {
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
        "import/no-extraneous-dependencies": [
          "error",
          { devDependencies: ["**/*.test.ts", "**/*.test.tsx", "**/test/**"] },
        ],
        "import/extensions": "off",
      },
    },
  ],
  ignorePatterns: ["dist/", "node_modules/", "*.cjs"],
  rules: {
    "import/prefer-default-export": "off",
    "quotes": ["error", "double", { avoidEscape: true }],
    "max-len": ["warn", { code: 120, ignoreUrls: true, ignoreStrings: true }],
    "comma-dangle": ["warn", "always-multiline"],
    "no-nested-ternary": "warn",
    "object-curly-newline": "off",
    "lines-between-class-members": "off",
    "prefer-destructuring": "off",
    "no-multiple-empty-lines": ["warn", { max: 2 }],
    "no-use-before-define": "off",
    "@typescript-eslint/no-use-before-define": "off",
    "class-methods-use-this": "off",
    "no-void": ["error", { allowAsStatement: true }],
    "indent": "off",
    "@typescript-eslint/indent": "off",
    "operator-linebreak": "off",
    "no-confusing-arrow": "off",
    "implicit-arrow-linebreak": "off",
    "function-paren-newline": "off",
    "consistent-return": "off",
    "no-restricted-syntax": "off",
    "default-case": "off",
    "no-case-declarations": "off",
    "no-new": "off",
  },
};

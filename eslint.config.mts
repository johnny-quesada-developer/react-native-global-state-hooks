import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

const $globals = {
  ...globals.browser,
  AudioWorkletGlobalScope: false,
};

// @ts-expect-error: Unable to assign to read only property
delete $globals["AudioWorkletGlobalScope "];

export default defineConfig([
  {
    ignores: ["**.js", "**.d.ts", "coverage/**", "node_modules/**"],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: $globals,
    },
    rules: {
      // 🚫 forbid describe.only, it.only, test.only, etc.
      "no-restricted-syntax": [
        "warn",
        {
          selector:
            'CallExpression[callee.object.name="describe"][callee.property.name="only"], ' +
            'CallExpression[callee.object.name="it"][callee.property.name="only"], ' +
            'CallExpression[callee.object.name="$it"][callee.property.name="only"], ' +
            'CallExpression[callee.object.name="test"][callee.property.name="only"]',
          message: "Remove .only from tests before committing.",
        },
      ],
    },
  },
  tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
]);

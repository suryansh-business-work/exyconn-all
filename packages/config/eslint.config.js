import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import globals from "globals";

/** The config package ships plain Node ESM helpers, not React code. */
export default defineConfig([
  { ignores: ["node_modules/**"] },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: globals.node,
    },
  },
]);

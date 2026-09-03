import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

/**
 * ESLint flat config shared by every package that renders UI (the design system,
 * shell, login, crud, tabber and each micro-frontend). Everything MUI goes through
 * `@exyconn/ui`; `muiAllowed` lists the files exempt from that — in practice only the
 * design system's own sources.
 */

/** The `no-restricted-imports` option object that blocks direct MUI usage. */
export function muiGuard(uiImport = "@exyconn/ui") {
  const message = `Import MUI components from "${uiImport}" instead.`;
  const stylesMessage = `Import styling utilities from "${uiImport}/styles" instead.`;
  return {
    paths: [
      { name: "@mui/material", message },
      { name: "@mui/material/styles", message: stylesMessage },
      { name: "@mui/system", message: stylesMessage },
      { name: "@mui/lab", message },
      {
        name: "@mui/x-date-pickers",
        message: `Import MUIX pickers from "${uiImport}/pickers" instead.`,
      },
    ],
    patterns: [
      { group: ["@mui/material/*"], message },
      { group: ["@mui/system/*"], message },
      { group: ["@mui/lab/*"], message },
      {
        group: ["@mui/x-*", "@mui/x-*/**"],
        message: `Import MUIX components from "${uiImport}" instead.`,
      },
    ],
  };
}

/** Rules every TypeScript package in the workspace agrees on. */
export const baseRules = {
  "@typescript-eslint/no-explicit-any": "warn",
  "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
};

export function portalEslintConfig({
  uiImport = "@exyconn/ui",
  muiAllowed = [],
} = {}) {
  const exemptions = muiAllowed.length
    ? [{ files: muiAllowed, rules: { "no-restricted-imports": "off" } }]
    : [];
  return defineConfig([
    { ignores: ["dist/**", "node_modules/**", "src/graphql/generated/**"] },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
      files: ["**/*.{ts,tsx}"],
      languageOptions: {
        ecmaVersion: 2021,
        sourceType: "module",
        globals: { ...globals.browser, ...globals.es2021 },
      },
      plugins: { "react-hooks": reactHooks },
      rules: {
        ...baseRules,
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn",
        // Everything goes through the design system.
        "no-restricted-imports": ["error", muiGuard(uiImport)],
      },
    },
    ...exemptions,
  ]);
}

export default portalEslintConfig;

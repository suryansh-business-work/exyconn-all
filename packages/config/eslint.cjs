/**
 * ESLint rules shared by every package that renders UI (the design system, shell,
 * login, crud, tabber and each micro-frontend). Everything MUI goes through
 * `@exyconn/ui`; `muiAllowed` lists the files exempt from that — in practice only the
 * design system's own sources.
 */
const MUI_GUARD_MESSAGE = (uiImport) =>
  `Import MUI components from "${uiImport}" instead.`;

/** The `no-restricted-imports` option object that blocks direct MUI usage. */
function muiGuard(uiImport = "@exyconn/ui") {
  const message = MUI_GUARD_MESSAGE(uiImport);
  return {
    paths: [
      { name: "@mui/material", message },
      {
        name: "@mui/material/styles",
        message: `Import styling utilities from "${uiImport}/styles" instead.`,
      },
      {
        name: "@mui/system",
        message: `Import styling utilities from "${uiImport}/styles" instead.`,
      },
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

module.exports = function portalEslintConfig({
  uiImport = "@exyconn/ui",
  muiAllowed = [],
} = {}) {
  return {
    root: true,
    parser: "@typescript-eslint/parser",
    parserOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      ecmaFeatures: { jsx: true },
    },
    plugins: ["@typescript-eslint", "react-hooks", "react-refresh"],
    extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
    settings: { react: { version: "detect" } },
    env: { browser: true, es2021: true },
    ignorePatterns: ["dist", "node_modules", "src/graphql/generated"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // Everything goes through the design system.
      "no-restricted-imports": ["error", muiGuard(uiImport)],
    },
    overrides: muiAllowed.length
      ? [{ files: muiAllowed, rules: { "no-restricted-imports": "off" } }]
      : [],
  };
};

module.exports.muiGuard = muiGuard;

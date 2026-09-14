import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactNativeA11y from "eslint-plugin-react-native-a11y";
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

/**
 * WCAG 2.2 AA, as far as a linter can see it — for web UI (the portals, the design system,
 * the desktop tracker's renderer).
 *
 * jsx-a11y knows only DOM elements, so the design system's components are mapped to the
 * element each renders: an `IconButton` with no `aria-label` is then the same error as a
 * `<button>` with no name, and `component="a"` is followed through.
 */
export const webA11y = {
  files: ["**/*.tsx"],
  plugins: { "jsx-a11y": jsxA11y },
  settings: {
    "jsx-a11y": {
      polymorphicPropName: "component",
      components: {
        Button: "button",
        IconButton: "button",
        Fab: "button",
        ToggleButton: "button",
        Link: "a",
        Avatar: "img",
        CardMedia: "img",
      },
    },
  },
  rules: {
    ...jsxA11y.flatConfigs.recommended.rules,
    // MUI's own inputs carry their label through `label`, which this rule cannot see.
    "jsx-a11y/control-has-associated-label": "off",
    // Moving focus into a dialog's first field is what the WAI-ARIA dialog pattern asks for;
    // those are design-system components (`<TextField autoFocus>`). A raw DOM element grabbing
    // focus on a page is still an error.
    "jsx-a11y/no-autofocus": ["error", { ignoreNonDOM: true }],
    // `<Link component={RouterLink} to="…">` renders a real href; the rule only knows `href`.
    "jsx-a11y/anchor-is-valid": ["error", { components: ["Link"], specialLink: ["to"] }],
  },
};

/**
 * The React Native equivalent, for the phone tracker. Validates the accessibility props a
 * screen reader reads (role, state, value, actions) and refuses touchables nested inside
 * touchables, which TalkBack and VoiceOver cannot reach separately. A hint is not a WCAG
 * requirement — a name and a role are — so that rule is off.
 */
export const nativeA11y = {
  files: ["**/*.tsx"],
  plugins: { "react-native-a11y": reactNativeA11y },
  rules: {
    ...reactNativeA11y.configs.basic.rules,
    "react-native-a11y/has-accessibility-hint": "off",
  },
};

export function portalEslintConfig({
  uiImport = "@exyconn/ui",
  muiAllowed = [],
  platform = "web",
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
    platform === "native" ? nativeA11y : webA11y,
  ]);
}

export default portalEslintConfig;

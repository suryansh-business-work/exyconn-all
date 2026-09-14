import type { Linter } from "eslint";

export interface PortalEslintOptions {
  /** Barrel every MUI import must go through. Defaults to `@exyconn/ui`. */
  uiImport?: string;
  /** Glob patterns exempt from the MUI guard (the design system's own sources). */
  muiAllowed?: string[];
  /** Which accessibility rules apply: DOM (`web`, the default) or React Native (`native`). */
  platform?: "web" | "native";
}

export function muiGuard(uiImport?: string): {
  paths: Array<{ name: string; message: string }>;
  patterns: Array<{ group: string[]; message: string }>;
};
export const baseRules: Linter.RulesRecord;
/** WCAG 2.2 AA lint rules for web UI (jsx-a11y, with the design system's components mapped). */
export const webA11y: Linter.Config;
/** WCAG 2.2 AA lint rules for React Native UI (react-native-a11y). */
export const nativeA11y: Linter.Config;
export function portalEslintConfig(
  options?: PortalEslintOptions,
): Linter.Config[];
export default portalEslintConfig;

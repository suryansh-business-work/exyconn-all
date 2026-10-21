import type { Linter } from "eslint";

export interface PortalEslintOptions {
  /** Barrel every MUI import must go through. Defaults to `@exyconn/ui`. */
  uiImport?: string;
  /** Glob patterns exempt from the MUI guard (the design system's own sources). */
  muiAllowed?: string[];
  /** Which accessibility rules apply: DOM (`web`, the default) or React Native (`native`). */
  platform?: "web" | "native";
  /**
   * Portal forms: the bare `@hookform/resolvers/zod` resolver is refused in favour of the
   * shell's, which lets every field star and hint itself from the form's schema.
   */
  shellForms?: boolean;
}

/** Path of the shell's own form resolver, the one file allowed the bare one. */
export const SHELL_ZOD_RESOLVER: string;
export function muiGuard(
  uiImport?: string,
  shellForms?: boolean,
): {
  paths: Array<{ name: string; message: string; importNames?: string[] }>;
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

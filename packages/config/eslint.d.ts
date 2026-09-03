import type { Linter } from "eslint";

export interface PortalEslintOptions {
  /** Barrel every MUI import must go through. Defaults to `@exyconn/ui`. */
  uiImport?: string;
  /** Glob patterns exempt from the MUI guard (the design system's own sources). */
  muiAllowed?: string[];
}

export function muiGuard(uiImport?: string): {
  paths: Array<{ name: string; message: string }>;
  patterns: Array<{ group: string[]; message: string }>;
};
export const baseRules: Linter.RulesRecord;
export function portalEslintConfig(
  options?: PortalEslintOptions,
): Linter.Config[];
export default portalEslintConfig;

import { themeSelector } from "../theme";
import type { CmsDesignSystem } from "./types";

/**
 * A site's design system as CSS custom properties, under the names the site's stylesheets
 * already read (styles/tokens/theme.plugin.ts): `--color-<role>` by day on `:root` and by
 * night under `[data-theme="dark"]`, `--font-family-<k>`, `--radius-<k>`, `--shadow-<k>` and
 * `--space-<k>`. The rules are unlayered, so they win over the token plugin's (which sit in
 * Tailwind's base layer) — exyconn.com's design system holds the plugin's own values, so for
 * it nothing changes; another site's design system repaints every role.
 */
const GROUP_PREFIXES = {
  palette: "palette",
  fonts: "font-family",
  radii: "radius",
  shadows: "shadow",
  spacing: "space",
} as const;

/** The server refuses anything else; checked again here because this is written into <style>. */
const SAFE_NAME = /^[a-z\d][a-z\d-]{0,60}$/i;
const SAFE_VALUE = /^[^;{}<>]{1,300}$/;

function declarations(prefix: string, values: Record<string, string> | undefined): string[] {
  return Object.entries(values ?? {})
    .filter(([name, value]) => SAFE_NAME.test(name) && SAFE_VALUE.test(String(value)))
    .map(([name, value]) => `--${prefix}-${name}:${value};`);
}

/** Keeps author CSS inside its <style> element: `</style` would end it early. */
export const safeCss = (css: string): string => css.replaceAll(/<\/style/gi, String.raw`<\/style`);

export function designSystemCss(design: CmsDesignSystem | null): string {
  if (!design) {
    return "";
  }
  const { tokens } = design;
  const light = [
    ...declarations("color", tokens.colors?.light),
    ...Object.entries(GROUP_PREFIXES).flatMap(([group, prefix]) =>
      declarations(prefix, tokens[group as keyof typeof GROUP_PREFIXES])
    ),
  ];
  const dark = declarations("color", tokens.colors?.dark);
  const rules = [
    light.length > 0 ? `:root{${light.join("")}}` : "",
    dark.length > 0 ? `${themeSelector("dark")}{${dark.join("")}}` : "",
    safeCss(design.extraCss),
  ];
  return rules.filter(Boolean).join("\n");
}

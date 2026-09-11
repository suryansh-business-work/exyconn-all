/**
 * Light/dark mode. The chosen mode lives on `<html data-theme>` — set before first paint by
 * the inline script in `Page.astro`, flipped by `ThemeToggle.astro` — and every colour role
 * in `styles/tokens/semantic.tokens.ts` answers from whichever block that selects.
 */
export const THEMES = ["light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_ATTRIBUTE = "data-theme";
/** The visitor's explicit choice. Absent means "follow the operating system". */
export const THEME_STORAGE_KEY = "exyconn-theme";
export const DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";

/** `[data-theme="dark"]` — the selector the night roles are declared under. */
export const themeSelector = (theme: Theme): string => `[${THEME_ATTRIBUTE}="${theme}"]`;

export const isTheme = (value: unknown): value is Theme => THEMES.some((theme) => theme === value);

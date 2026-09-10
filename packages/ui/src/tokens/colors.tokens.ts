/**
 * Every colour the design system is allowed to paint, as named ramps.
 *
 * This file is the ONLY place a hex literal may appear. Nothing else in the workspace
 * writes `'#4f8cff'` — it writes `color.blue[400]`, so a hue can be retuned in one edit
 * instead of grepped across sixteen portals.
 *
 * Shades run light (low number) to dark (high number) WITHIN a family; the numbers are
 * lightness buckets, not a promise that `blue[500]` and `green[500]` are equally light.
 * Families exist because the workspace genuinely uses two neutral sources (the GitHub-ish
 * chrome greys and Tailwind's slate) and two blues (the house accent and the tuned chart
 * ramp) — collapsing them would change screens, not just names.
 *
 * Raw ramps carry no meaning. Do not reach for one in a component: pick the semantic token
 * from `modes/light.token.ts` / `modes/dark.token.ts` (via the theme) and use a ramp only
 * for a categorical accent that is genuinely about identity, never about state.
 */

/** Absolute white. Its own token because it is a value, not a shade of the grey ramp. */
export const white = '#ffffff';

/**
 * Absolute black. Used ONLY to build scrims — nothing in this system paints text or a
 * surface with it; the darkest ink is `neutral[900]`, which is a colour rather than a hole.
 */
export const black = '#000000';

/** Chrome greys — page, panel, hairline, ink. The portal's own neutral. */
export const neutral = {
  0: white,
  50: '#f7f8fa',
  100: '#e6e8ec',
  300: '#9aa4b2',
  500: '#5c6672',
  700: '#2b313b',
  800: '#161b22',
  900: '#0d1117',
} as const;

/** Tailwind slate — the cooler neutral, used for muted accents and the tracker's ink. */
export const slate = {
  400: '#94a3b8',
  500: '#64748b',
  900: '#111827',
  950: '#0f172a',
} as const;

/** The house accent blue. `400` is the one worn by most stat tiles. */
export const blue = {
  400: '#4f8cff',
  500: '#3b82f6',
  600: '#155dfc',
} as const;

/**
 * The tuned sequential blue behind charts. Separate from `blue` on purpose: these seven
 * steps were picked to read as one magnitude ramp, and swapping any of them for a `blue`
 * shade breaks the progression. See charts/palette.ts before touching them.
 */
export const azure = {
  100: '#cde2fb',
  200: '#9ec5f4',
  300: '#6da7ec',
  400: '#3987e5',
  500: '#2a78d6',
  600: '#256abf',
  800: '#184f95',
} as const;

export const indigo = {
  200: '#8b87f5',
  300: '#9085e9',
  400: '#6366f1',
  500: '#6c5ce7',
  600: '#4f46e5',
  800: '#4a3aa7',
} as const;

export const violet = {
  200: '#b58cff',
  300: '#a78bfa',
  400: '#8b5cf6',
  500: '#7c3aed',
} as const;

export const purple = {
  300: '#c084fc',
  400: '#a855f7',
} as const;

export const fuchsia = { 500: '#d946ef' } as const;

export const pink = {
  300: '#e87ba4',
  400: '#ec4899',
  500: '#d55181',
} as const;

export const rose = { 500: '#e11d48' } as const;

export const red = {
  200: '#ff6b6b',
  300: '#f97066',
  400: '#e66767',
  500: '#ef4444',
  600: '#e34948',
  700: '#d03b3b',
  800: '#dc2626',
  900: '#d92d20',
} as const;

export const orange = {
  300: '#ec835a',
  400: '#eb6834',
  500: '#f9851f',
  600: '#f97316',
  700: '#d95926',
  800: '#b54708',
} as const;

export const amber = {
  200: '#ffd166',
  300: '#f5b544',
  400: '#fab219',
  500: '#f59e0b',
  600: '#eda100',
  700: '#d97706',
  800: '#c98500',
} as const;

export const green = {
  300: '#7be37b',
  500: '#22c55e',
  600: '#16a34a',
  700: '#0ca30c',
  800: '#008300',
} as const;

export const emerald = {
  300: '#47cd89',
  400: '#34d399',
  600: '#1baf7a',
  700: '#199e70',
  800: '#059669',
  900: '#067647',
} as const;

export const teal = {
  400: '#00d2c6',
  500: '#14b8a6',
  600: '#0d9488',
} as const;

export const cyan = {
  400: '#00d4ff',
  500: '#06b6d4',
  600: '#0891b2',
} as const;

export const sky = { 500: '#0ea5e9' } as const;

/** Every ramp under one name, so a consumer imports `color` and nothing else. */
export const color = {
  white,
  black,
  neutral,
  slate,
  blue,
  azure,
  indigo,
  violet,
  purple,
  fuchsia,
  pink,
  rose,
  red,
  orange,
  amber,
  green,
  emerald,
  teal,
  cyan,
  sky,
} as const;

/** The families a categorical accent may be drawn from. */
export type ColorFamily = keyof typeof color;

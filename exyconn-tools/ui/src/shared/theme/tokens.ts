/**
 * The Exyconn night palette, matched to exyconn.com's home stage: deep navy/violet
 * surfaces, neon violet/fuchsia/cyan accents and an orange measurement tick.
 * The ONLY place shell colours are written; components read them from here or the theme.
 */
export const night = {
  /** Page behind the hero bands. */
  base: '#05061a',
  /** Mid-band navy-violet the hero gradient passes through. */
  indigo: '#1a1450',
  /** Raised night surface (glass fill before transparency). */
  surface: '#0c0e2a',
  line: 'rgba(255, 255, 255, 0.12)',
  fg: '#f4f5ff',
  fgSecondary: 'rgba(228, 230, 255, 0.78)',
  fgMuted: 'rgba(228, 230, 255, 0.62)',
} as const;

export const neon = {
  violet: '#a684ff',
  fuchsia: '#ed6aff',
  cyan: '#00d3f3',
  orange: '#ff8904',
  lime: '#9ae600',
} as const;

/** The gradient the condensed headline accent and primary CTA wear. */
export const accentGradient = `linear-gradient(90deg, ${neon.violet}, ${neon.fuchsia} 50%, ${neon.cyan})`;

/** The night band behind hero sections (both colour modes). */
export const nightBand = `radial-gradient(ellipse 55% 70% at 78% 30%, rgba(142, 81, 255, 0.32), transparent 70%),
  radial-gradient(ellipse 45% 55% at 12% 90%, rgba(0, 211, 243, 0.14), transparent 70%),
  linear-gradient(180deg, ${night.base}, ${night.indigo} 60%, ${night.base})`;

export const fonts = {
  sans: '"Inter Tight", "Inter", "Segoe UI", Roboto, system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
} as const;

/** Explicit pixel radii for shell surfaces, independent of `shape.borderRadius`. */
export const radii = {
  control: '10px',
  card: '16px',
  panel: '20px',
  pill: '999px',
} as const;

/** Minimum touch target (WCAG 2.5.8 / Apple HIG). */
export const TAP_TARGET = 44;

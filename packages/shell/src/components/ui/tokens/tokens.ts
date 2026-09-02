/**
 * Single source of truth for the spacing/radius/duration/fontWeight scales
 * used by the ui-kit primitives (Spacer, Text.weight, etc).
 */

export const SPACING_UNIT = 8;

/** Returns `factor * SPACING_UNIT` as a raw px number (e.g. `spacing(2)` -> 16). */
export function spacing(factor: number): number {
  return factor * SPACING_UNIT;
}

// Raw px values for plain style props (e.g. `style={{ borderRadius: radius.sm }}`).
// NOT for MUI's sx `borderRadius`, which is a `theme.shape.borderRadius` multiplier
// (a different unit system) rather than a raw px value.
export const radius = { sm: 4, md: 8, lg: 16, pill: 9999 } as const;

// Durations in ms.
export const duration = { fast: 120, base: 200, slow: 320 } as const;

export const easing = { standard: 'cubic-bezier(0.4, 0, 0.2, 1)' } as const;

// MUST equal ui/src/config/theme.ts's fontWeightRegular/Medium/Bold.
export const fontWeight = { regular: 400, medium: 600, bold: 800 } as const;

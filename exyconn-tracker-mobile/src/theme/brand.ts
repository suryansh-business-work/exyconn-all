import type { Branding, ThemeMode } from '@exyconn/tracker-core';
import { FALLBACK_BRAND, ON_DARK, ON_LIGHT } from './palette';

const HEX = /^#?([\da-f]{3}|[\da-f]{6})$/i;

/** Above this perceived luminance a colour reads as light, and wants dark ink on it. */
const LIGHT_THRESHOLD = 0.5;

/** Accept `#abc`, `abc`, `#aabbcc`; anything else falls back to the Exyconn default. */
export function toHex(value: string | undefined, fallback: string): string {
  const match = HEX.exec((value ?? '').trim());
  if (match === null) {
    return fallback;
  }
  const body = match[1];
  if (body.length === 3) {
    return `#${body[0]}${body[0]}${body[1]}${body[1]}${body[2]}${body[2]}`;
  }
  return `#${body}`;
}

/** Perceived luminance 0–1 — decides light vs dark, and which ink sits on a colour. */
export function luminance(hex: string): number {
  const value = Number.parseInt(hex.slice(1), 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export interface BrandColors {
  primary: string;
  /** Ink that reads on `primary`. */
  onPrimary: string;
  secondary: string;
  background: string;
}

/** The portal branding's colours, normalised — the only part of `Branding` the UI depends on. */
export function brandColors(branding: Branding | null): BrandColors {
  const primary = toHex(branding?.primaryColor, FALLBACK_BRAND.primary);
  return {
    primary,
    onPrimary: luminance(primary) > LIGHT_THRESHOLD ? ON_LIGHT : ON_DARK,
    secondary: toHex(branding?.secondaryColor, FALLBACK_BRAND.secondary),
    background: toHex(branding?.backgroundColor, FALLBACK_BRAND.background),
  };
}

/**
 * Which palette to paint, given the employee's choice — the desktop tracker's rule. `system`
 * reads the brand's own background as well as the OS, so the workspace decides as it always
 * has; an explicit light or dark is the employee overruling that for their own screen.
 */
export function resolveScheme(
  mode: ThemeMode,
  brandBackground: string,
  systemPrefersDark: boolean,
): 'light' | 'dark' {
  if (mode === 'light' || mode === 'dark') {
    return mode;
  }
  return systemPrefersDark || luminance(brandBackground) < LIGHT_THRESHOLD ? 'dark' : 'light';
}

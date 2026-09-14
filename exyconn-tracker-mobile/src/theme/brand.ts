import type { Branding, ThemeMode } from '@exyconn/tracker-core';
import { ensureContrast, readableInk } from '@exyconn/ui/src/a11y/contrast';
import { CHROME, FALLBACK_BRAND, ON_DARK, ON_LIGHT } from './palette';

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

/**
 * The portal branding's colours, normalised — the only part of `Branding` the UI depends on —
 * and made readable (WCAG 2.2 AA) on the scheme they are painted in.
 *
 * The brand colour is a workspace's choice, and the app uses it as TEXT (links), as icons and
 * as the edge of a checked box. A pale brand on the light chrome would be unreadable, so it is
 * moved just far enough toward black or white to clear 4.5:1 on the panel; the ink laid on it
 * is picked by the WCAG contrast formula rather than by a brightness guess.
 */
export function brandColors(branding: Branding | null, scheme: 'light' | 'dark'): BrandColors {
  const primary = ensureContrast(
    toHex(branding?.primaryColor, FALLBACK_BRAND.primary),
    CHROME[scheme].paper,
  );
  return {
    primary,
    onPrimary: readableInk(primary, ON_LIGHT, ON_DARK),
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

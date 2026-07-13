import { alpha, createTheme, type CSSObject, type Theme } from '@mui/material/styles';
import type { Branding } from '@shared/types';

/** Exyconn defaults, used until the portal branding arrives (or if it fails to load). */
const FALLBACK = {
  primaryColor: '#6C5CE7',
  secondaryColor: '#00D2C6',
  backgroundColor: '#0C1024',
  textColor: '#F4F6FF',
} as const;

const HEX = /^#?([\da-f]{3}|[\da-f]{6})$/i;

/** Accept `#abc`, `abc`, `#aabbcc`; anything else falls back to the Exyconn default. */
function toHex(value: string | undefined, fallback: string): string {
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

/** Perceived luminance 0–1 — decides whether the palette runs light or dark. */
function luminance(hex: string): number {
  const value = Number.parseInt(hex.slice(1), 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export interface BrandColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
}

/** Normalised brand colours — the only part of `Branding` the theme depends on. */
export function brandColors(branding: Branding | null): BrandColors {
  return {
    primary: toHex(branding?.primaryColor, FALLBACK.primaryColor),
    secondary: toHex(branding?.secondaryColor, FALLBACK.secondaryColor),
    background: toHex(branding?.backgroundColor, FALLBACK.backgroundColor),
    text: toHex(branding?.textColor, FALLBACK.textColor),
  };
}

/**
 * The one frosted-glass recipe every surface in this app uses.
 * `backdrop-filter` only shows up when something non-opaque sits behind it, so the
 * gradient lives on the app root (AppBackground) and never on the glass itself.
 */
export function glass(theme: Theme, tint = 0.1): CSSObject {
  const isDark = theme.palette.mode === 'dark';
  const fill = alpha('#FFFFFF', isDark ? tint : tint + 0.52);
  const border = alpha(isDark ? '#FFFFFF' : '#0F172A', isDark ? 0.16 : 0.08);
  const drop = isDark ? 'rgba(2, 6, 23, 0.45)' : 'rgba(15, 23, 42, 0.14)';
  const sheen = alpha('#FFFFFF', isDark ? 0.14 : 0.65);
  return {
    backgroundColor: fill,
    backdropFilter: 'blur(20px) saturate(160%)',
    WebkitBackdropFilter: 'blur(20px) saturate(160%)',
    border: `1px solid ${border}`,
    borderRadius: 4,
    boxShadow: `0 18px 44px ${drop}, inset 0 1px 0 ${sheen}`,
  };
}

const FONT_STACK = [
  '"Segoe UI"',
  '-apple-system',
  'BlinkMacSystemFont',
  'Roboto',
  'Helvetica',
  'Arial',
  'sans-serif',
].join(', ');

/** Build the MUI theme from the portal branding (null → Exyconn defaults). */
export function buildTheme(branding: Branding | null): Theme {
  const colors = brandColors(branding);
  const isDark = luminance(colors.background) < 0.5;
  const mode = isDark ? 'dark' : 'light';
  const divider = alpha(isDark ? '#FFFFFF' : '#0F172A', 0.12);

  return createTheme({
    palette: {
      mode,
      primary: { main: colors.primary },
      secondary: { main: colors.secondary },
      background: { default: colors.background, paper: alpha(colors.background, 0.6) },
      text: { primary: colors.text, secondary: alpha(colors.text, 0.68) },
      divider,
    },
    // Product decision: nothing in the app is rounded by more than 4px.
    shape: { borderRadius: 4 },
    typography: {
      fontFamily: FONT_STACK,
      h5: { fontWeight: 700, letterSpacing: '-0.01em' },
      h6: { fontWeight: 700, letterSpacing: '-0.01em' },
      subtitle2: { fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: { root: { backgroundImage: 'none' } },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 4,
            paddingInline: 18,
            transition: 'transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease',
            '&:hover': { transform: 'translateY(-1px)' },
            '&.Mui-disabled': { transform: 'none' },
          },
          contained: { boxShadow: `0 10px 24px ${alpha(colors.primary, 0.35)}` },
          outlined: { borderColor: divider, backdropFilter: 'blur(8px)' },
        },
      },
      // The window is narrow, so every input in the app runs at the compact size.
      MuiTextField: { defaultProps: { size: 'small' } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            backgroundColor: alpha('#FFFFFF', isDark ? 0.06 : 0.5),
            backdropFilter: 'blur(8px)',
            transition: 'background-color 180ms ease',
            '&:hover': { backgroundColor: alpha('#FFFFFF', isDark ? 0.1 : 0.66) },
            '& .MuiOutlinedInput-notchedOutline': { borderColor: divider },
          },
        },
      },
      MuiChip: { styleOverrides: { root: { borderRadius: 4, fontWeight: 600 } } },
      MuiLinearProgress: { styleOverrides: { root: { borderRadius: 4, height: 4 } } },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: alpha('#0F172A', 0.92),
            backdropFilter: 'blur(10px)',
            borderRadius: 4,
            fontSize: 12,
          },
        },
      },
      MuiTableCell: { styleOverrides: { root: { borderColor: divider } } },
    },
  });
}

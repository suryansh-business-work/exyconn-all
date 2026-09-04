import { alpha, createTheme } from '@exyconn/ui';
import type { CSSObject, Theme } from '@exyconn/ui';
import type { Branding, ThemeMode } from '@shared/types';

/** Exyconn defaults, used until the portal branding arrives (or if it fails to load). */
const FALLBACK = {
  primaryColor: '#6C5CE7',
  secondaryColor: '#00D2C6',
  backgroundColor: '#0C1024',
  textColor: '#F4F6FF',
} as const;

/** Neutral app chrome. The brand supplies the accent; it does not tint every pixel. */
const CHROME = {
  light: { app: '#F4F5F7', paper: '#FFFFFF', text: '#111827', muted: '#5B6472' },
  dark: { app: '#0F1216', paper: '#171B21', text: '#E7EAEE', muted: '#9AA4B2' },
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
 * The one surface recipe every panel in this app uses: opaque fill, hairline border, a shadow
 * just deep enough to lift it off the page.
 *
 * Deliberately NOT frosted glass. `backdrop-filter` made Chromium re-sample the panel's own
 * painted text as its backdrop, which ghosted a blurred duplicate of every glyph behind it —
 * the calendar was unreadable. An opaque surface also keeps text contrast predictable.
 */
export function surface(theme: Theme): CSSObject {
  const isDark = theme.palette.mode === 'dark';
  return {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    // '4px', not 4: this object is spread into an `sx` prop, where a NUMBER is a multiplier of
    // theme.shape.borderRadius (4) and would silently render 16px. A string is literal.
    borderRadius: '4px',
    boxShadow: isDark ? 'none' : '0 1px 2px rgba(16, 24, 40, 0.06)',
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

/**
 * Which palette to paint, given the employee's choice.
 *
 * `system` keeps the old behaviour of reading the brand's own background — the workspace
 * decides, as it always did. An explicit light or dark is the employee overruling that for
 * their own screen, which is the whole point of offering it.
 */
function resolveDark(mode: ThemeMode, background: string, systemPrefersDark: boolean): boolean {
  if (mode === 'light') {
    return false;
  }
  if (mode === 'dark') {
    return true;
  }
  return systemPrefersDark || luminance(background) < 0.5;
}

/** Build the MUI theme from the portal branding (null → Exyconn defaults). */
export function buildTheme(
  branding: Branding | null,
  themeMode: ThemeMode = 'system',
  systemPrefersDark = false,
): Theme {
  const colors = brandColors(branding);
  const isDark = resolveDark(themeMode, colors.background, systemPrefersDark);
  const mode = isDark ? 'dark' : 'light';
  const chrome = isDark ? CHROME.dark : CHROME.light;
  const divider = alpha(isDark ? '#FFFFFF' : '#0F172A', isDark ? 0.1 : 0.1);

  return createTheme({
    palette: {
      mode,
      primary: { main: colors.primary },
      secondary: { main: colors.secondary },
      background: { default: chrome.app, paper: chrome.paper },
      text: { primary: chrome.text, secondary: chrome.muted },
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
          root: { borderRadius: 4, paddingInline: 16 },
          outlined: { borderColor: divider },
        },
      },
      // The window is narrow, so every input in the app runs at the compact size.
      MuiTextField: { defaultProps: { size: 'small' } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            backgroundColor: chrome.paper,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: divider },
          },
        },
      },
      MuiChip: { styleOverrides: { root: { borderRadius: 4, fontWeight: 600 } } },
      MuiLinearProgress: { styleOverrides: { root: { borderRadius: 4, height: 4 } } },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark ? '#2B313B' : '#111827',
            borderRadius: 4,
            fontSize: 12,
          },
        },
      },
      MuiTableCell: { styleOverrides: { root: { borderColor: divider } } },
      MuiTabs: { styleOverrides: { root: { minHeight: 40 } } },
      MuiTab: { styleOverrides: { root: { minHeight: 40, paddingBlock: 8 } } },
      // MUI X paints calendar cells as circles by default; the 4px ceiling applies to them too.
      MuiPickersDay: { styleOverrides: { root: { borderRadius: 4 } } },
    },
  });
}

import {
  TRACKER_RADIUS,
  alpha,
  borderWidth,
  boxShadow,
  color,
  createTheme,
  fontFamily,
  fontSize,
  fontWeight,
  letterSpacing,
  spacing,
} from '@exyconn/ui';
import type { CSSObject, Theme } from '@exyconn/ui';
import type { Branding, ThemeMode } from '@shared/types';

/** Exyconn defaults, used until the portal branding arrives (or if it fails to load). */
const FALLBACK = {
  primaryColor: color.indigo[500],
  secondaryColor: color.teal[400],
  backgroundColor: color.slate[950],
  textColor: color.neutral[50],
} as const;

/** Neutral app chrome. The brand supplies the accent; it does not tint every pixel. */
const CHROME = {
  light: {
    app: color.neutral[50],
    paper: color.white,
    text: color.slate[900],
    muted: color.neutral[500],
  },
  dark: {
    app: color.neutral[900],
    paper: color.neutral[800],
    text: color.neutral[100],
    muted: color.neutral[300],
  },
} as const;

const HEX = /^#?([\da-f]{3}|[\da-f]{6})$/i;

/** The hairline, as an opacity over the ink — the same weight on either ground. */
const DIVIDER_OPACITY = 0.1;

/** Chrome heights that are not a multiple of the 8px rhythm would fight the panels. */
const TAB_HEIGHT = spacing(5);
const BUTTON_INLINE_PADDING = spacing(2);
const PROGRESS_HEIGHT = spacing(0.5);

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
    border: `${borderWidth.hairline}px solid ${theme.palette.divider}`,
    // A STRING, not a number: this object is spread into an `sx` prop, where a number is a
    // multiplier of theme.shape.borderRadius and would silently render four times too round.
    borderRadius: `${TRACKER_RADIUS}px`,
    boxShadow: isDark ? boxShadow.dark.none : boxShadow.light.sm,
  };
}

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
  const divider = alpha(isDark ? color.white : color.slate[950], DIVIDER_OPACITY);

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
    shape: { borderRadius: TRACKER_RADIUS },
    typography: {
      fontFamily: fontFamily.system,
      h5: { fontWeight: fontWeight.bold, letterSpacing: letterSpacing.snug },
      h6: { fontWeight: fontWeight.bold, letterSpacing: letterSpacing.snug },
      subtitle2: { fontWeight: fontWeight.semibold },
      button: { textTransform: 'none', fontWeight: fontWeight.semibold },
    },
    components: {
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: { root: { backgroundImage: 'none' } },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: TRACKER_RADIUS, paddingInline: BUTTON_INLINE_PADDING },
          outlined: { borderColor: divider },
        },
      },
      // The window is narrow, so every input in the app runs at the compact size.
      MuiTextField: { defaultProps: { size: 'small' } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: TRACKER_RADIUS,
            backgroundColor: chrome.paper,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: divider },
          },
        },
      },
      MuiChip: {
        styleOverrides: { root: { borderRadius: TRACKER_RADIUS, fontWeight: fontWeight.semibold } },
      },
      MuiLinearProgress: {
        styleOverrides: { root: { borderRadius: TRACKER_RADIUS, height: PROGRESS_HEIGHT } },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark ? color.neutral[700] : color.slate[900],
            borderRadius: TRACKER_RADIUS,
            fontSize: fontSize.xs,
          },
        },
      },
      MuiTableCell: { styleOverrides: { root: { borderColor: divider } } },
      MuiTabs: { styleOverrides: { root: { minHeight: TAB_HEIGHT } } },
      MuiTab: { styleOverrides: { root: { minHeight: TAB_HEIGHT, paddingBlock: spacing(1) } } },
      // MUI X paints calendar cells as circles by default; the 4px ceiling applies to them too.
      MuiPickerDay: { styleOverrides: { root: { borderRadius: TRACKER_RADIUS } } },
    },
  });
}

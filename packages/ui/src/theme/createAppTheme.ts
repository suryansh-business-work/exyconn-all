import { createTheme, type Theme } from '../styles';

export type ColorMode = 'light' | 'dark';

/**
 * Inter, with a system fallback that looks like it on every platform.
 *
 * Chosen over Nunito for what this portal actually is: dense operational chrome — long
 * sidebars, wide grids, columns of money. Nunito's rounded terminals read as friendly at
 * poster sizes and as mush at 13px in a table. Inter was drawn for interface text at small
 * sizes and ships the tabular figures the finance screens need.
 */
const FONT =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif';

/** Money and any column of digits. Proportional figures make a total column look ragged. */
const TABULAR = "'tabular-nums' 1";

/**
 * Flat, Stripe-inspired design tokens per mode. The look is carried by a neutral
 * surface palette, crisp 1px borders and soft low-spread shadows — no frosted glass,
 * no gradients. Consumed once by `createAppTheme` so the whole portal shifts together.
 */
const tokensFor = (isLight: boolean) => ({
  // Indigo, a shade quieter than the blurple it replaces: the accent is worn by every
  // primary button and every selected row, so it is the one colour seen all day.
  primary: isLight ? '#4f46e5' : '#8b87f5',
  /**
   * Ink on a primary button. White on the dark mode's lighter indigo reaches only 3:1 —
   * a button nobody can read is worse than no button, so dark mode inks it dark instead.
   */
  onPrimary: isLight ? '#ffffff' : '#0d1117',
  secondary: '#f9851f',
  success: isLight ? '#067647' : '#47cd89',
  warning: isLight ? '#b54708' : '#f5b544',
  error: isLight ? '#d92d20' : '#f97066',
  bgDefault: isLight ? '#f7f8fa' : '#0d1117',
  bgPaper: isLight ? '#ffffff' : '#161b22',
  textPrimary: isLight ? '#14181f' : '#e6e9ef',
  textSecondary: isLight ? '#5c6672' : '#9aa4b2',
  divider: isLight ? '#e6e8ec' : 'rgba(255,255,255,0.10)',
  // Elevation is carried by the hairline border; the shadow only lifts it off the page.
  shadowSm: isLight
    ? '0 1px 2px rgba(16,24,40,0.05), 0 1px 3px rgba(16,24,40,0.06)'
    : '0 1px 2px rgba(0,0,0,0.5)',
  shadowMd: isLight
    ? '0 2px 6px rgba(16,24,40,0.06), 0 6px 16px rgba(16,24,40,0.08)'
    : '0 4px 16px rgba(0,0,0,0.55)',
});

/** Which way the script the portal is being read in runs. */
export type ThemeDirection = 'ltr' | 'rtl';

/**
 * Builds the Exyconn theme for the given mode. Compact density, Inter type.
 *
 * `direction` is on the theme rather than only on the document because MUI's own components
 * read it to place their icons, drawers and menus — a right-to-left page whose theme still
 * says left-to-right puts every dropdown arrow on the wrong side.
 */
export function createAppTheme(mode: ColorMode, direction: ThemeDirection = 'ltr'): Theme {
  const isLight = mode === 'light';
  const t = tokensFor(isLight);
  return createTheme({
    direction,
    palette: {
      mode,
      primary: { main: t.primary, contrastText: t.onPrimary },
      secondary: { main: t.secondary },
      success: { main: t.success },
      warning: { main: t.warning },
      error: { main: t.error },
      background: { default: t.bgDefault, paper: t.bgPaper },
      text: { primary: t.textPrimary, secondary: t.textSecondary },
      divider: t.divider,
    },
    // One radius everywhere. Cards at 6 and panels at 9 is a difference nobody chose and
    // everybody sees, and `glass` follows this number rather than carrying its own.
    shape: { borderRadius: 8 },
    /**
     * Weights are a step lighter than they were across the board. At 800 every heading and
     * every button shouted, which left nothing louder to mark the thing that mattered.
     */
    typography: {
      fontFamily: FONT,
      fontWeightRegular: 400,
      fontWeightMedium: 500,
      fontWeightBold: 700,
      h4: { fontFamily: FONT, fontWeight: 700, letterSpacing: '-0.02em' },
      h5: { fontFamily: FONT, fontWeight: 700, letterSpacing: '-0.015em' },
      h6: { fontFamily: FONT, fontWeight: 600, letterSpacing: '-0.01em' },
      subtitle2: { fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600 },
      overline: { fontWeight: 600, letterSpacing: '0.06em' },
    },
    components: {
      MuiButton: { defaultProps: { disableElevation: true, size: 'small' } },
      MuiTextField: { defaultProps: { size: 'small' } },
      MuiLink: { defaultProps: { underline: 'none' } },
      // Compact density: the portal is dense, data-heavy chrome, so the shared
      // primitives start small and every screen inherits the tighter rhythm.
      MuiToolbar: { styleOverrides: { dense: { minHeight: 48 } } },
      MuiListItemButton: { styleOverrides: { root: { paddingTop: 4, paddingBottom: 4 } } },
      MuiTable: { defaultProps: { size: 'small' } },
      MuiChip: { defaultProps: { size: 'small' } },
      MuiSelect: { defaultProps: { size: 'small' } },
      MuiCardContent: {
        styleOverrides: { root: { padding: 12, '&:last-child': { paddingBottom: 12 } } },
      },
      MuiDialogContent: { styleOverrides: { root: { paddingTop: 12, paddingBottom: 12 } } },
      // Flat surfaces: no background gradient, a hairline border and a soft shadow.
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
          outlined: { borderColor: t.divider },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: { border: `1px solid ${t.divider}`, boxShadow: t.shadowSm },
        },
      },
      MuiMenu: {
        styleOverrides: { paper: { border: `1px solid ${t.divider}`, boxShadow: t.shadowMd } },
      },
      MuiPopover: {
        styleOverrides: { paper: { border: `1px solid ${t.divider}`, boxShadow: t.shadowMd } },
      },
      // Tabular figures wherever digits line up in a column: a total that does not align
      // with the numbers above it is the first thing that makes a finance screen look cheap.
      MuiTableCell: {
        styleOverrides: { root: { borderColor: t.divider, fontVariantNumeric: TABULAR } },
      },
      MuiCssBaseline: {
        styleOverrides: {
          a: { textDecoration: 'none', color: 'inherit' },
          // ag-grid renders outside MUI's components but shows the same money.
          '.ag-cell, .ag-header-cell-text': { fontVariantNumeric: TABULAR },
          // A focus ring the keyboard can see. MUI hides its default on mouse click, so
          // this only ever shows for somebody actually tabbing through.
          ':focus-visible': {
            outline: `2px solid ${t.primary}`,
            outlineOffset: 2,
          },
        },
      },
    },
  });
}

/** Default theme instance used by standalone component tests. */
export const theme = createAppTheme('light');

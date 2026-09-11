import { createTheme, type Theme } from '../styles';
import { BASE_RADIUS, CARD_RADIUS, borderWidth, radius } from '../tokens/border.token';
import { selectedInk } from '../tokens/selection.token';
import { fontFamily, fontWeight, letterSpacing, numeric } from '../tokens/typography.token';
import { spacing } from '../tokens/spacing.token';
import { tokensFor, type ColorMode } from '../tokens/modes';

export type { ColorMode };

/** Which way the script the portal is being read in runs. */
export type ThemeDirection = 'ltr' | 'rtl';

/** Compact density: this is dense, data-heavy chrome, so every primitive starts small. */
const DENSE_TOOLBAR_HEIGHT = spacing(6);
const DENSE_CARD_PADDING = spacing(1.5);
const DENSE_LIST_PADDING = spacing(0.5);
const HAIRLINE = `${borderWidth.hairline}px solid`;
/** Cards, panels and dialogs: the soft card corner, as a px string (a number in sx multiplies). */
const CARD_CORNER = `${CARD_RADIUS}px`;
/** Menus and popovers sit between a control and a card. */
const FLOATING_CORNER = `${BASE_RADIUS + 2}px`;
const PILL = `${radius.pill}px`;
/** A tab inside its pill track. */
const TAB_HEIGHT = spacing(4.5);
const TAB_TRACK_PADDING = spacing(0.5);

/**
 * Builds the Exyconn theme for the given mode.
 *
 * Every value comes from `src/tokens` — this file decides which token plays which MUI role
 * and nothing else. A colour that is not in the tokens cannot be in the theme.
 *
 * `direction` is on the theme rather than only on the document because MUI's own components
 * read it to place their icons, drawers and menus — a right-to-left page whose theme still
 * says left-to-right puts every dropdown arrow on the wrong side.
 */
export function createAppTheme(mode: ColorMode, direction: ThemeDirection = 'ltr'): Theme {
  const t = tokensFor(mode);
  const selected = { backgroundColor: selectedInk[mode].fill, color: selectedInk[mode].ink };
  return createTheme({
    direction,
    palette: {
      mode,
      primary: { main: t.primary, contrastText: t.onPrimary },
      secondary: { main: t.secondary },
      success: { main: t.success },
      warning: { main: t.warning },
      error: { main: t.error },
      background: { default: t.background.page, paper: t.background.panel },
      text: { primary: t.text.primary, secondary: t.text.secondary },
      divider: t.divider,
    },
    // Two corners, both from tokens: controls at BASE_RADIUS, every card-like surface at
    // CARD_RADIUS (Paper, Card, Dialog, `glass`, the grid). Chips and tabs are pills.
    shape: { borderRadius: BASE_RADIUS },
    typography: {
      fontFamily: fontFamily.sans,
      fontWeightRegular: fontWeight.regular,
      fontWeightMedium: fontWeight.medium,
      fontWeightBold: fontWeight.bold,
      // The page title: big and tight, as the trackers draw theirs.
      h4: { fontSize: '2rem', fontWeight: fontWeight.bold, letterSpacing: letterSpacing.tighter },
      h5: { fontWeight: fontWeight.bold, letterSpacing: letterSpacing.tight },
      h6: { fontWeight: fontWeight.semibold, letterSpacing: letterSpacing.snug },
      subtitle2: { fontWeight: fontWeight.semibold },
      button: { textTransform: 'none', fontWeight: fontWeight.semibold },
      overline: { fontWeight: fontWeight.semibold, letterSpacing: letterSpacing.wide },
    },
    components: {
      MuiButton: { defaultProps: { disableElevation: true, size: 'small' } },
      MuiTextField: { defaultProps: { size: 'small' } },
      MuiLink: { defaultProps: { underline: 'none' } },
      MuiToolbar: { styleOverrides: { dense: { minHeight: DENSE_TOOLBAR_HEIGHT } } },
      MuiTable: { defaultProps: { size: 'small' } },
      MuiChip: {
        defaultProps: { size: 'small' },
        styleOverrides: { root: { borderRadius: PILL, fontWeight: fontWeight.semibold } },
      },
      // Tabs are a pill track on paper, the selected tab an inverted-ink pill inside it.
      MuiTabs: {
        styleOverrides: {
          root: {
            minHeight: TAB_HEIGHT + TAB_TRACK_PADDING * 2,
            padding: TAB_TRACK_PADDING,
            borderRadius: PILL,
            backgroundColor: t.background.panel,
            border: `${HAIRLINE} ${t.divider}`,
            '&.MuiTabs-vertical': { borderRadius: CARD_CORNER },
          },
          indicator: { display: 'none' },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            minHeight: TAB_HEIGHT,
            paddingBlock: spacing(0.75),
            borderRadius: PILL,
            textTransform: 'none',
            fontWeight: fontWeight.semibold,
            '&.Mui-selected': selected,
          },
        },
      },
      // The current row of any selectable list (the sidebar's page first of all).
      MuiListItemButton: {
        styleOverrides: {
          root: {
            paddingTop: DENSE_LIST_PADDING,
            paddingBottom: DENSE_LIST_PADDING,
            '&.Mui-selected, &.Mui-selected:hover, &.Mui-selected.Mui-focusVisible': selected,
            '&.Mui-selected .MuiListItemIcon-root': { color: 'inherit' },
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: { root: { borderRadius: PILL }, bar: { borderRadius: PILL } },
      },
      MuiOutlinedInput: {
        styleOverrides: { root: { backgroundColor: t.background.panel } },
      },
      MuiTooltip: { styleOverrides: { tooltip: { borderRadius: `${radius.md}px` } } },
      MuiSelect: { defaultProps: { size: 'small' } },
      MuiCardContent: {
        styleOverrides: {
          root: {
            padding: DENSE_CARD_PADDING,
            '&:last-child': { paddingBottom: DENSE_CARD_PADDING },
          },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: { paddingTop: DENSE_CARD_PADDING, paddingBottom: DENSE_CARD_PADDING },
        },
      },
      // Flat surfaces: no background gradient, a hairline border and a soft shadow.
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
          rounded: { borderRadius: CARD_CORNER },
          outlined: { borderColor: t.divider },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: CARD_CORNER,
            border: `${HAIRLINE} ${t.divider}`,
            boxShadow: t.shadow.sm,
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: FLOATING_CORNER,
            border: `${HAIRLINE} ${t.divider}`,
            boxShadow: t.shadow.md,
          },
        },
      },
      MuiPopover: {
        styleOverrides: {
          paper: {
            borderRadius: FLOATING_CORNER,
            border: `${HAIRLINE} ${t.divider}`,
            boxShadow: t.shadow.md,
          },
        },
      },
      MuiAutocomplete: { styleOverrides: { paper: { borderRadius: FLOATING_CORNER } } },
      // Tabular figures wherever digits line up in a column: a total that does not align
      // with the numbers above it is the first thing that makes a finance screen look cheap.
      MuiTableCell: {
        styleOverrides: {
          root: { borderColor: t.divider, fontVariantNumeric: numeric.tabular },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          a: { textDecoration: 'none', color: 'inherit' },
          /**
           * A `<button>` does not inherit colour or type from its parent — the UA paints it
           * with `buttontext`, which on a dark surface is near-black. Every `Box
           * component="button"` in the workspace was therefore unreadable in dark mode. MUI's
           * own buttons set both properties in their own class, which outranks this element
           * selector, so they are untouched.
           */
          button: { font: 'inherit', color: 'inherit', letterSpacing: 'inherit' },
          // ag-grid renders outside MUI's components but shows the same money.
          '.ag-cell, .ag-header-cell-text': { fontVariantNumeric: numeric.tabular },
          // A focus ring the keyboard can see. MUI hides its default on mouse click, so
          // this only ever shows for somebody actually tabbing through.
          ':focus-visible': {
            outline: `${borderWidth.thick}px solid ${t.primary}`,
            outlineOffset: borderWidth.thick,
          },
        },
      },
    },
  });
}

/** Default theme instance used by standalone component tests. */
export const theme = createAppTheme('light');

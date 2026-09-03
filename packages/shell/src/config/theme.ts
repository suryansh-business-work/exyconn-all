import { createTheme, type Theme } from '@/components/ui/styles';

export type ColorMode = 'light' | 'dark';

const FONT = '"Nunito", "Segoe UI", system-ui, sans-serif';

/**
 * Flat, Stripe-inspired design tokens per mode. The look is carried by a neutral
 * surface palette, crisp 1px borders and soft low-spread shadows — no frosted glass,
 * no gradients. Consumed once by `createAppTheme` so the whole portal shifts together.
 */
const tokensFor = (isLight: boolean) => ({
  // Blurple accent (Stripe's signature indigo) with a lighter dark-mode variant.
  primary: isLight ? '#635bff' : '#9d97ff',
  secondary: '#f9851f',
  success: isLight ? '#1f9d57' : '#3fbf7f',
  warning: isLight ? '#bb5504' : '#f0b429',
  error: isLight ? '#df1b41' : '#ff6b6b',
  bgDefault: isLight ? '#f6f8fb' : '#0b0e17',
  bgPaper: isLight ? '#ffffff' : '#151a26',
  textPrimary: isLight ? '#1a1f36' : '#e6e9f2',
  textSecondary: isLight ? '#5b6472' : '#9aa3b8',
  divider: isLight ? '#e3e8ee' : 'rgba(255,255,255,0.09)',
  // Soft, layered elevation — Stripe leans on borders, so shadows stay subtle.
  shadowSm: isLight
    ? '0 1px 2px rgba(16,24,40,0.05), 0 1px 3px rgba(16,24,40,0.06)'
    : '0 1px 2px rgba(0,0,0,0.5)',
  shadowMd: isLight
    ? '0 2px 6px rgba(16,24,40,0.06), 0 6px 16px rgba(16,24,40,0.08)'
    : '0 4px 16px rgba(0,0,0,0.55)',
});

/** Builds the Exyconn theme for the given mode. Compact density, Nunito type. */
export function createAppTheme(mode: ColorMode): Theme {
  const isLight = mode === 'light';
  const t = tokensFor(isLight);
  return createTheme({
    palette: {
      mode,
      primary: { main: t.primary, contrastText: '#ffffff' },
      secondary: { main: t.secondary },
      success: { main: t.success },
      warning: { main: t.warning },
      error: { main: t.error },
      background: { default: t.bgDefault, paper: t.bgPaper },
      text: { primary: t.textPrimary, secondary: t.textSecondary },
      divider: t.divider,
    },
    shape: { borderRadius: 6 },
    typography: {
      fontFamily: FONT,
      fontWeightRegular: 400,
      fontWeightMedium: 600,
      fontWeightBold: 800,
      h4: { fontFamily: FONT, fontWeight: 800 },
      h5: { fontFamily: FONT, fontWeight: 800 },
      h6: { fontFamily: FONT, fontWeight: 700 },
      subtitle2: { fontWeight: 700 },
      button: { textTransform: 'none', fontWeight: 700 },
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
      MuiTableCell: { styleOverrides: { root: { borderColor: t.divider } } },
      MuiCssBaseline: { styleOverrides: { a: { textDecoration: 'none', color: 'inherit' } } },
    },
  });
}

/** Default theme instance used by standalone component tests. */
export const theme = createAppTheme('light');

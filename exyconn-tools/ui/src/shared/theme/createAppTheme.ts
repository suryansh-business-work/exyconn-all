import { createTheme, type Theme } from '@mui/material/styles';
import { fonts, radii } from './tokens';

export type ThemeMode = 'light' | 'dark';

const display = { fontFamily: fonts.sans, fontWeight: 800, letterSpacing: '-0.03em' };

/**
 * The tools theme. Shape stays at 4px so the 130 tool UIs keep their sx radii; shell
 * surfaces and the shared controls get explicit pixel radii instead.
 */
export function createAppTheme(mode: ThemeMode): Theme {
  const dark = mode === 'dark';
  return createTheme({
    palette: {
      mode,
      primary: { main: dark ? '#a684ff' : '#7008e7', contrastText: dark ? '#0b0726' : '#ffffff' },
      secondary: { main: dark ? '#00d3f3' : '#0069a8' },
      background: {
        default: dark ? '#070818' : '#f6f6fb',
        paper: dark ? '#0f1130' : '#ffffff',
      },
      divider: dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 17, 48, 0.1)',
      text: dark
        ? { primary: '#f4f5ff', secondary: 'rgba(228, 230, 255, 0.74)' }
        : { primary: '#0f1130', secondary: 'rgba(15, 17, 48, 0.7)' },
    },
    typography: {
      fontFamily: fonts.sans,
      h1: display,
      h2: display,
      h3: { ...display, fontWeight: 700 },
      h4: { ...display, fontWeight: 700, letterSpacing: '-0.02em' },
      h5: { fontFamily: fonts.sans, fontWeight: 700, letterSpacing: '-0.015em' },
      h6: { fontFamily: fonts.sans, fontWeight: 700, letterSpacing: '-0.01em' },
      overline: { fontFamily: fonts.mono, letterSpacing: '0.18em', fontWeight: 500 },
      button: { letterSpacing: 0, textTransform: 'none', fontWeight: 600 },
      body1: { lineHeight: 1.65 },
      body2: { lineHeight: 1.6 },
    },
    shape: { borderRadius: 4 },
    components: {
      MuiButton: { styleOverrides: { root: { borderRadius: radii.control, fontWeight: 600 } } },
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none', borderRadius: radii.control } } },
      MuiCard: { styleOverrides: { root: { borderRadius: radii.card } } },
      MuiDialog: { styleOverrides: { paper: { borderRadius: radii.panel } } },
      MuiOutlinedInput: { styleOverrides: { root: { borderRadius: radii.control } } },
      MuiChip: { styleOverrides: { root: { borderRadius: '8px', fontWeight: 600 } } },
      MuiAppBar: { styleOverrides: { root: { borderRadius: 0 } } },
      MuiDrawer: { styleOverrides: { paper: { borderRadius: 0 } } },
      MuiAccordion: { styleOverrides: { root: { '&::before': { display: 'none' } } } },
      MuiCssBaseline: {
        styleOverrides: { body: { WebkitFontSmoothing: 'antialiased' } },
      },
    },
  });
}

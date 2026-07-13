import { createTheme, type Theme } from '@/components/ui/styles';

export type ColorMode = 'light' | 'dark';

const FONT = '"Nunito", "Segoe UI", system-ui, sans-serif';

/** Builds the Exyconn theme for the given mode. Compact density, Nunito type. */
export function createAppTheme(mode: ColorMode): Theme {
  const isLight = mode === 'light';
  return createTheme({
    palette: {
      mode,
      primary: { main: isLight ? '#155dfc' : '#4f8cff', contrastText: '#ffffff' },
      secondary: { main: '#f9851f' },
      success: { main: isLight ? '#16a34a' : '#7be37b' },
      warning: { main: '#f5b324' },
      error: { main: isLight ? '#dc2626' : '#ff6b6b' },
      background: {
        default: isLight ? '#eef1f8' : '#06070d',
        paper: isLight ? '#ffffff' : '#11121b',
      },
      text: isLight
        ? { primary: '#101426', secondary: 'rgba(16,20,38,0.6)' }
        : { primary: '#eef1fb', secondary: 'rgba(238,241,251,0.6)' },
      divider: isLight ? 'rgba(16,20,38,0.12)' : 'rgba(255,255,255,0.1)',
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
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiCssBaseline: { styleOverrides: { a: { textDecoration: 'none', color: 'inherit' } } },
    },
  });
}

/** Default theme instance used by standalone component tests. */
export const theme = createAppTheme('light');

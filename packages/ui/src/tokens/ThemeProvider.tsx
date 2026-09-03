import type { ReactNode } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider as MuiThemeProvider, type Theme } from '../styles';
import { theme as defaultTheme } from '../theme';

/**
 * The app itself bootstraps via src/theme/ColorModeContext.tsx (persisted
 * dark/light mode + this same createAppTheme) — this export is for isolated
 * mounts (tests, previews) and is NOT wired into App.tsx; do not touch
 * App.tsx or ColorModeContext.tsx.
 */
export interface ThemeProviderProps {
  theme?: Theme;
  children: ReactNode;
}

export function ThemeProvider({ theme = defaultTheme, children }: ThemeProviderProps) {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}

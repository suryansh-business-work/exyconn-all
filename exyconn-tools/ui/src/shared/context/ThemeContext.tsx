import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as ThemeMode) || 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', mode);
  }, [mode]);

  const toggleTheme = () => setMode((prev) => (prev === 'light' ? 'dark' : 'light'));

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: '#6366f1' },
          secondary: { main: '#ec4899' },
          background: {
            default: mode === 'dark' ? '#0f172a' : '#f8fafc',
            paper: mode === 'dark' ? '#1e293b' : '#ffffff',
          },
        },
        typography: {
          // Body copy stays on Inter; headings use Sora, whose wider counters and
          // tighter caps read better at large sizes than Inter's near-uniform
          // rhythm. Both ship variable weights, so the pair costs one extra file.
          fontFamily: '"Inter", "Segoe UI", Roboto, system-ui, sans-serif',
          h1: { fontFamily: '"Sora", "Inter", sans-serif', fontWeight: 700, letterSpacing: '-0.025em' },
          h2: { fontFamily: '"Sora", "Inter", sans-serif', fontWeight: 700, letterSpacing: '-0.022em' },
          h3: { fontFamily: '"Sora", "Inter", sans-serif', fontWeight: 700, letterSpacing: '-0.02em' },
          h4: { fontFamily: '"Sora", "Inter", sans-serif', fontWeight: 700, letterSpacing: '-0.018em' },
          h5: { fontFamily: '"Sora", "Inter", sans-serif', fontWeight: 600, letterSpacing: '-0.015em' },
          h6: { fontFamily: '"Sora", "Inter", sans-serif', fontWeight: 600, letterSpacing: '-0.01em' },
          button: { letterSpacing: 0 },
          body1: { lineHeight: 1.65 },
          body2: { lineHeight: 1.6 },
        },
        shape: { borderRadius: 4 },
        components: {
          MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600, borderRadius: 4 } } },
          MuiPaper: { styleOverrides: { root: { backgroundImage: 'none', borderRadius: 4 } } },
          MuiCard: { styleOverrides: { root: { borderRadius: 4 } } },
          MuiDialog: { styleOverrides: { paper: { borderRadius: 4 } } },
          MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 4 } } },
          MuiChip: { styleOverrides: { root: { borderRadius: 4 } } },
        },
      }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

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
        typography: { fontFamily: '"Inter", "Roboto", sans-serif' },
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

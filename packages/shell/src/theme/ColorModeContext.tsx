import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis';
import { useI18n } from '@exyconn/i18n';
import { ThemeProvider, CssBaseline } from '@exyconn/ui/styles';
import { createAppTheme, type ColorMode, type ThemeDirection } from '@exyconn/ui/theme';

const STORAGE_KEY = 'exyconn-track.color-mode';

interface ColorModeContextValue {
  mode: ColorMode;
  toggle: () => void;
}

const ColorModeContext = createContext<ColorModeContextValue | undefined>(undefined);

function readInitialMode(): ColorMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'dark' || stored === 'light' ? stored : 'dark';
}

/**
 * One emotion cache per direction.
 *
 * Right-to-left is not a `dir` attribute and a mirrored icon: every `margin-left`,
 * `padding-right` and `transform` emotion generates has to be flipped too, which is what
 * the stylis plugin does. Built once per direction rather than per render — rebuilding the
 * cache throws away every style the page has already inserted.
 */
const CACHES: Record<ThemeDirection, ReturnType<typeof createCache>> = {
  ltr: createCache({ key: 'mui', stylisPlugins: [prefixer] }),
  rtl: createCache({ key: 'mui-rtl', stylisPlugins: [prefixer, rtlPlugin] }),
};

/** Holds the active color mode (persisted) and supplies the matching MUI theme. */
export function ColorModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ColorMode>(readInitialMode);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const value = useMemo<ColorModeContextValue>(
    () => ({ mode, toggle: () => setMode((m) => (m === 'light' ? 'dark' : 'light')) }),
    [mode],
  );
  // The direction comes from the language, so the theme is rebuilt when either changes.
  const { direction } = useI18n();
  const theme = useMemo(() => createAppTheme(mode, direction), [mode, direction]);

  return (
    <ColorModeContext.Provider value={value}>
      <CacheProvider value={CACHES[direction]}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </CacheProvider>
    </ColorModeContext.Provider>
  );
}

export function useColorMode(): ColorModeContextValue {
  const ctx = useContext(ColorModeContext);
  if (!ctx) throw new Error('useColorMode must be used within a ColorModeProvider');
  return ctx;
}

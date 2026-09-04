import { useEffect, useMemo, useState } from 'react';
import type { Theme } from '@exyconn/ui';
import type { Branding, ThemeMode } from '@shared/types';
import { buildTheme } from '../theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

/**
 * Whether the OS is asking for a dark palette right now, and again whenever that changes —
 * somebody on a schedule-based auto dark mode should not have to relaunch the tracker at dusk.
 */
function useSystemPrefersDark(): boolean {
  const [prefersDark, setPrefersDark] = useState(
    () => globalThis.matchMedia?.(DARK_QUERY).matches ?? false,
  );

  useEffect(() => {
    const query = globalThis.matchMedia?.(DARK_QUERY);
    if (!query) {
      return undefined;
    }
    const onChange = (event: MediaQueryListEvent): void => setPrefersDark(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return prefersDark;
}

/**
 * The MUI theme built from the portal branding and the employee's light/dark choice. The
 * tracker state is republished every second, so this is keyed on exactly what `buildTheme`
 * reads — otherwise every tick would rebuild the theme and re-render the whole tree.
 */
export default function useBrandTheme(
  branding: Branding | null,
  themeMode: ThemeMode = 'system',
): Theme {
  const systemPrefersDark = useSystemPrefersDark();

  return useMemo(
    () => buildTheme(branding, themeMode, systemPrefersDark),
    [
      branding?.primaryColor,
      branding?.secondaryColor,
      branding?.backgroundColor,
      branding?.textColor,
      themeMode,
      systemPrefersDark,
    ],
  );
}

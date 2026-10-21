import { useEffect, useState } from 'react';
import type { ThemeChoice } from '../storage/prefs';
import type { ColorScheme } from '../theme/theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

/** The scheme to paint: the user's explicit choice, or the system's when they chose "system". */
export function useColorScheme(choice: ThemeChoice): ColorScheme {
  const [systemDark, setSystemDark] = useState(() => globalThis.matchMedia(DARK_QUERY).matches);

  useEffect(() => {
    const query = globalThis.matchMedia(DARK_QUERY);
    const listener = (event: MediaQueryListEvent): void => setSystemDark(event.matches);
    query.addEventListener('change', listener);
    return () => query.removeEventListener('change', listener);
  }, []);

  if (choice === 'system') {
    return systemDark ? 'dark' : 'light';
  }
  return choice;
}

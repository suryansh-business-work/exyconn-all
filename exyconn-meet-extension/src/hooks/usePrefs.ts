import { createPrefsStore, parsePrefs, PREFS_KEY, type ExtensionPrefs } from '../storage/prefs';
import type { KeyValueArea } from '../storage/area';
import { useStoredValue } from './useStoredValue';

const readPrefs = (area: KeyValueArea): Promise<ExtensionPrefs> => createPrefsStore(area).read();

/** The user's extension settings, live. Null until the first read lands. */
export function usePrefs(): { prefs: ExtensionPrefs | null; error: Error | null } {
  const { value, error } = useStoredValue(PREFS_KEY, parsePrefs, readPrefs);
  return { prefs: value, error };
}

import { useEffect, useState } from 'react';
import type { KeyValueArea } from '../storage/area';
import { toError } from '../utils/errors';

/**
 * A value in chrome.storage.sync, kept live: read once, then updated whenever any context
 * (the options page, another window) changes it.
 */
export function useStoredValue<T>(
  key: string,
  parse: (raw: unknown) => T,
  read: (area: KeyValueArea) => Promise<T>,
): { value: T | null; error: Error | null } {
  const [value, setValue] = useState<T | null>(null);
  const [failure, setFailure] = useState<Error | null>(null);

  useEffect(() => {
    let live = true;
    read(chrome.storage.sync)
      .then((loaded) => {
        if (live) {
          setValue(loaded);
        }
      })
      .catch((error: unknown) => {
        if (live) {
          setFailure(toError(error, 'Could not read settings'));
        }
      });
    const listener = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string,
    ): void => {
      if (area === 'sync' && key in changes) {
        setValue(parse(changes[key].newValue));
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => {
      live = false;
      chrome.storage.onChanged.removeListener(listener);
    };
  }, [key, parse, read]);

  return { value, error: failure };
}

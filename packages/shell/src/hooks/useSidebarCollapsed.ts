import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'exyconn-track.sidebar-collapsed';

/** Reads the stored preference. Private browsing can throw, so a failure means "expanded". */
function readStored(): boolean {
  try {
    return globalThis.localStorage?.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Whether the desktop sidebar is showing as an icon rail, remembered per browser.
 * Every portal app reads the same key, so collapsing in one keeps it collapsed after
 * jumping to another subdomain on the same machine.
 */
export function useSidebarCollapsed(): [boolean, () => void] {
  const [collapsed, setCollapsed] = useState(readStored);

  useEffect(() => {
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, collapsed ? '1' : '0');
    } catch {
      // A browser that refuses storage still gets a working toggle for this session.
    }
  }, [collapsed]);

  const toggle = useCallback(() => setCollapsed((value) => !value), []);
  return [collapsed, toggle];
}

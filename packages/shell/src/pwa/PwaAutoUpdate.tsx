import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { usePwaUpdate } from './usePwaUpdate';

/**
 * Takes a newer build of this portal without asking. It never reloads under somebody's hands:
 * the swap happens while the tab is in the background, or on their next move to another page
 * (which leaves the current screen anyway), so a half-filled form is never lost.
 *
 * Rendered inside the router, which is how it sees the next navigation.
 */
export function PwaAutoUpdate() {
  const { ready, apply } = usePwaUpdate();
  const { pathname } = useLocation();
  const readyAt = useRef<string | null>(null);

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (readyAt.current === null) {
      readyAt.current = pathname;
    } else if (readyAt.current !== pathname) {
      apply();
    }
  }, [ready, pathname, apply]);

  useEffect(() => {
    if (!ready) {
      return;
    }
    const applyWhenHidden = () => {
      if (document.visibilityState === 'hidden') {
        apply();
      }
    };
    applyWhenHidden();
    document.addEventListener('visibilitychange', applyWhenHidden);
    return () => document.removeEventListener('visibilitychange', applyWhenHidden);
  }, [ready, apply]);

  return null;
}

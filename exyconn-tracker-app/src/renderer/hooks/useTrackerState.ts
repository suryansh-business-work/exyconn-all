import { useEffect, useState } from 'react';
import type { TrackerState } from '@shared/types';

/**
 * The live tracker state, pushed from the main process. Used by BOTH renderer entries — the
 * tracker window and the screenshot gallery — so the gallery is themed, and shows its times,
 * exactly as the main window does. `null` until the first snapshot lands.
 */
export default function useTrackerState(): TrackerState | null {
  const [state, setState] = useState<TrackerState | null>(null);

  useEffect(() => {
    let active = true;
    const unsubscribe = window.tracker.onStateChanged((next) => {
      if (active) {
        setState(next);
      }
    });
    window.tracker
      .getState()
      .then((initial) => {
        if (active) {
          setState(initial);
        }
      })
      .catch((error: unknown) => {
        console.error('Failed to load tracker state', error);
      });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return state;
}

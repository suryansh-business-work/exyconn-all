import { useEffect, useState } from 'react';
import type { UpdateState } from '@shared/types';

const IDLE: UpdateState = { stage: 'idle', version: '', percent: 0, lastCheckedAt: null };

/**
 * Where this install is in its own update cycle, pushed from the main process.
 *
 * Separate from the tracker state on purpose: an update concerns the app on disk, not the
 * session, and it is checked for whether or not anybody is signed in.
 */
export default function useUpdateState(): UpdateState {
  const [update, setUpdate] = useState<UpdateState>(IDLE);

  useEffect(() => {
    let active = true;
    const unsubscribe = window.tracker.onUpdateChanged((next) => {
      if (active) {
        setUpdate(next);
      }
    });
    window.tracker
      .getUpdate()
      .then((initial) => {
        if (active) {
          setUpdate(initial);
        }
      })
      .catch((error: unknown) => {
        console.error('Failed to read the update state', error);
      });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return update;
}

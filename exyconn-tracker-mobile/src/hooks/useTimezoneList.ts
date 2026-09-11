import { useCallback, useEffect, useState } from 'react';
import { tracker } from '../tracker/instance';

export interface TimezoneList {
  /** Null until the portal has answered. */
  zones: string[] | null;
  failed: boolean;
  reload: () => void;
}

/**
 * The zones the picker offers, from the portal: Hermes (the phone's JS engine) has no
 * `Intl.supportedValuesOf`, and calling it closed the Settings screen.
 */
export function useTimezoneList(): TimezoneList {
  const [zones, setZones] = useState<string[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setFailed(false);
    tracker
      .getTimezones()
      .then((next) => {
        if (active) {
          setZones(next);
        }
      })
      .catch((cause: unknown) => {
        console.error('Failed to load the timezone list', cause);
        if (active) {
          setFailed(true);
        }
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  const reload = useCallback(() => setAttempt((count) => count + 1), []);
  return { zones, failed, reload };
}

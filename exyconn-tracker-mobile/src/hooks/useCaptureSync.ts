import { useEffect, useState } from 'react';
import { tracker } from '../tracker/instance';

/**
 * Uploads what is waiting BEFORE the gallery reads the portal, when it was opened from a
 * capture notification. The shot the employee tapped is still sitting in the outbox — the
 * gallery reads the portal, so without this the one screenshot they came to see is the one
 * that is not there yet. A failed sync is logged and the gallery opens anyway: the rest of the
 * day is still worth showing.
 *
 * Returns true while that sync is in flight; false at once for a gallery opened from a day.
 */
export function useCaptureSync(capturedAt: string): boolean {
  const [syncing, setSyncing] = useState(capturedAt !== '');

  useEffect(() => {
    if (capturedAt === '') {
      setSyncing(false);
      return undefined;
    }
    let active = true;
    setSyncing(true);
    tracker
      .syncNow()
      .catch((cause: unknown) => {
        console.error('Sync after a capture notification failed', cause);
      })
      .finally(() => {
        if (active) {
          setSyncing(false);
        }
      });
    return () => {
      active = false;
    };
  }, [capturedAt]);

  return syncing;
}

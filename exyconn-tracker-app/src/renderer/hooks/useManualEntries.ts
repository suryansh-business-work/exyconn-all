import { useCallback, useEffect, useState } from 'react';
import { subDays } from 'date-fns';
import type { ManualEntry } from '@shared/types';

/**
 * How far back the list reaches. The portal refuses a claim older than 90 days, so there is
 * nothing further back that could still be acted on.
 */
const WINDOW_DAYS = 90;

export interface ManualEntriesQuery {
  entries: ManualEntry[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/** The signed-in employee's own claims for off-computer time, newest first. */
export default function useManualEntries(): ManualEntriesQuery {
  const [entries, setEntries] = useState<ManualEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signal, setSignal] = useState(0);

  const reload = useCallback(() => setSignal((count) => count + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    const now = new Date();
    window.tracker
      .getManualEntries(subDays(now, WINDOW_DAYS).toISOString(), now.toISOString())
      .then((rows) => {
        if (active) {
          setEntries(rows);
          setLoading(false);
        }
      })
      .catch((cause: unknown) => {
        console.error('Failed to load off-computer time', cause);
        if (active) {
          setEntries([]);
          setError('Could not load your claims. Check your connection and try again.');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [signal]);

  return { entries, loading, error, reload };
}

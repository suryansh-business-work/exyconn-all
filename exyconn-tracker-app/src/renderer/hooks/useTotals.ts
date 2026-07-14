import { useEffect, useState } from 'react';
import type { TrackerTotals } from '@shared/types';

export interface TotalsQuery {
  totals: TrackerTotals | null;
  loading: boolean;
  error: string | null;
}

/**
 * The employee's own all-time totals, from the portal.
 *
 * Refetched whenever `lastSyncAt` changes rather than on a timer: the totals only move when
 * this app uploads something, so a sync is exactly — and only — when they are stale. Polling
 * every second (the dashboard's own re-render rate) would hammer the portal for nothing.
 */
export default function useTotals(lastSyncAt: string | null): TotalsQuery {
  const [totals, setTotals] = useState<TrackerTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setError(null);
    window.tracker
      .getTotals()
      .then((next) => {
        if (active) {
          setTotals(next);
          setLoading(false);
        }
      })
      .catch((cause: unknown) => {
        console.error('Failed to load totals', cause);
        if (active) {
          setError('Could not load your all-time totals.');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [lastSyncAt]);

  return { totals, loading, error };
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  periodColumns,
  periodTotals,
  periodWindow,
  zonedToday,
  type PeriodColumn,
  type PeriodLength,
  type PeriodTotals,
  type PeriodWindow,
  type ReportDay,
} from '@exyconn/tracker-core';
import { tracker } from '../tracker/instance';

export interface PeriodInsights {
  range: PeriodWindow;
  current: PeriodTotals;
  previous: PeriodTotals;
  columns: PeriodColumn[];
  loading: boolean;
  error: string | null;
  /** Asks the portal again — pull-to-refresh. */
  reload: () => void;
}

/**
 * The last `length` days against the `length` before them, in one report query, bounded in the
 * employee's chosen zone like every other report range — the desktop's hook, on the phone.
 */
export function usePeriodInsights(length: PeriodLength, zone: string): PeriodInsights {
  // A number, not a Date: stable across renders for the memo, and no string parsing.
  const todayMs = zonedToday(zone).getTime();
  const range = useMemo(
    () => periodWindow(new Date(todayMs), length, zone),
    [todayMs, length, zone],
  );
  const [days, setDays] = useState<ReportDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    tracker
      .getReport(range.fromISO, range.toISO)
      .then((rows) => {
        if (active) {
          setDays(rows);
          setLoading(false);
        }
      })
      .catch((cause: unknown) => {
        console.error('Failed to load the period insights', cause);
        if (active) {
          setDays([]);
          setError('Could not load your insights. Check your connection and try again.');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [range, attempt]);

  const reload = useCallback(() => setAttempt((count) => count + 1), []);

  return useMemo(
    () => ({
      range,
      current: periodTotals(days, range.current),
      previous: periodTotals(days, range.previous),
      columns: periodColumns(days, range.current),
      loading,
      error,
      reload,
    }),
    [range, days, loading, error, reload],
  );
}

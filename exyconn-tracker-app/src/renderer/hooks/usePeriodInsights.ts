import { useEffect, useMemo, useState } from 'react';
import type { ReportDay } from '@shared/types';
import {
  periodColumns,
  periodTotals,
  periodWindow,
  zonedToday,
  type PeriodColumn,
  type PeriodLength,
  type PeriodTotals,
  type PeriodWindow,
} from '@exyconn/tracker-core';

export interface PeriodInsights {
  range: PeriodWindow;
  current: PeriodTotals;
  previous: PeriodTotals;
  columns: PeriodColumn[];
  loading: boolean;
  error: string | null;
}

/**
 * The last `length` days against the `length` before them, in one report query, bounded in the
 * employee's chosen zone like every other report range.
 */
export default function usePeriodInsights(length: PeriodLength, zone: string): PeriodInsights {
  // A number, not a Date: stable across renders for the memo, and no string parsing.
  const todayMs = zonedToday(zone).getTime();
  const range = useMemo(
    () => periodWindow(new Date(todayMs), length, zone),
    [todayMs, length, zone],
  );
  const [days, setDays] = useState<ReportDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    window.tracker
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
  }, [range]);

  return useMemo(
    () => ({
      range,
      current: periodTotals(days, range.current),
      previous: periodTotals(days, range.previous),
      columns: periodColumns(days, range.current),
      loading,
      error,
    }),
    [range, days, loading, error],
  );
}

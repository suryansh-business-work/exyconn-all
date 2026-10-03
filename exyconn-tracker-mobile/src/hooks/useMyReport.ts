import { useEffect, useState } from 'react';
import { monthBounds, type ReportDay } from '@exyconn/tracker-core';
import { sumReport, type ReportTotals } from '../lib/report/totals';
import { tracker } from '../tracker/instance';
import { useReload } from './useReload';

export interface ReportQuery {
  days: ReportDay[];
  totals: ReportTotals;
  /** True until the first answer for this month — the skeletons' cue. */
  loading: boolean;
  /** True while a pull-to-refresh re-reads a month already on screen. */
  refreshing: boolean;
  error: string | null;
  /** Asks the portal again — pull-to-refresh, the phone's "try again". */
  reload: () => void;
}

/**
 * Loads the signed-in employee's OWN tracked days for the given month.
 *
 * The month is bounded in the employee's CHOSEN zone, and the portal buckets the days it
 * returns by that same zone (the controller sends it with the query) — so the range asked
 * for, the days that come back and the labels drawn on them are all one zone, not three.
 */
export function useMyReport(month: Date, zone: string): ReportQuery {
  const [days, setDays] = useState<ReportDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { attempt, reload, isReload } = useReload();
  const { fromISO, toISO } = monthBounds(month, zone);

  useEffect(() => {
    let active = true;
    if (isReload(attempt)) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    tracker
      .getReport(fromISO, toISO)
      .then((rows) => {
        if (active) {
          setDays(rows);
          setLoading(false);
          setRefreshing(false);
        }
      })
      .catch((cause: unknown) => {
        console.error('Failed to load report', cause);
        if (active) {
          setDays([]);
          setError('Could not load your report. Check your connection and try again.');
          setLoading(false);
          setRefreshing(false);
        }
      });
    return () => {
      active = false;
    };
  }, [fromISO, toISO, attempt, isReload]);

  return { days, totals: sumReport(days), loading, refreshing, error, reload };
}

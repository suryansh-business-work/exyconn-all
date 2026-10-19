import { useEffect, useState } from 'react';
import type { ExpectedRange, ReportDay } from '@shared/types';
import { activityPercent, monthBounds } from '@exyconn/tracker-core';

export interface ReportTotals {
  activeMs: number;
  idleMs: number;
  activityPercent: number;
}

export interface ReportQuery {
  days: ReportDay[];
  /** The month's contracted hours per day; null until it arrives, or when it failed. */
  contract: ExpectedRange | null;
  totals: ReportTotals;
  loading: boolean;
  error: string | null;
}

function sum(days: readonly ReportDay[]): ReportTotals {
  let activeMs = 0;
  let idleMs = 0;
  for (const day of days) {
    activeMs += day.activeMs;
    idleMs += day.idleMs;
  }
  return { activeMs, idleMs, activityPercent: activityPercent(activeMs, idleMs) };
}

/**
 * Loads the signed-in employee's OWN tracked days for the given month.
 *
 * The month is bounded in the employee's CHOSEN zone, and the portal buckets the days it
 * returns by that same zone (the main process sends it with the query) — so the range asked
 * for, the days that come back and the labels drawn on them are all one zone, not three.
 */
export default function useMyReport(month: Date, zone: string): ReportQuery {
  const [days, setDays] = useState<ReportDay[]>([]);
  const [contract, setContract] = useState<ExpectedRange | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { fromISO, toISO } = monthBounds(month, zone);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    Promise.all([
      globalThis.tracker.getReport(fromISO, toISO),
      globalThis.tracker.getExpected(fromISO, toISO),
    ])
      .then(([rows, expected]) => {
        if (active) {
          setDays(rows);
          setContract(expected);
          setLoading(false);
        }
      })
      .catch((cause: unknown) => {
        console.error('Failed to load report', cause);
        if (active) {
          setDays([]);
          setContract(null);
          setError('Could not load your report. Check your connection and try again.');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [fromISO, toISO]);

  return { days, contract, totals: sum(days), loading, error };
}

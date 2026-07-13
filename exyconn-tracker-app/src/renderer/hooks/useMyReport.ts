import { useEffect, useState } from 'react';
import type { ReportDay } from '@shared/types';
import { activityPercent } from '../format';

export interface ReportTotals {
  activeMs: number;
  idleMs: number;
  activityPercent: number;
}

export interface ReportQuery {
  days: ReportDay[];
  totals: ReportTotals;
  loading: boolean;
  error: string | null;
}

/** [1st 00:00, next 1st 00:00) for the given month, as ISO datetimes. */
export function monthRange(month: Date): { fromISO: string; toISO: string } {
  const from = new Date(month.getFullYear(), month.getMonth(), 1);
  const to = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  return { fromISO: from.toISOString(), toISO: to.toISOString() };
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

/** Loads the signed-in employee's OWN tracked days for the given month. */
export default function useMyReport(month: Date): ReportQuery {
  const [days, setDays] = useState<ReportDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { fromISO, toISO } = monthRange(month);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    window.tracker
      .getReport(fromISO, toISO)
      .then((rows) => {
        if (active) {
          setDays(rows);
          setLoading(false);
        }
      })
      .catch((cause: unknown) => {
        console.error('Failed to load report', cause);
        if (active) {
          setDays([]);
          setError('Could not load your report. Check your connection and try again.');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [fromISO, toISO]);

  return { days, totals: sum(days), loading, error };
}

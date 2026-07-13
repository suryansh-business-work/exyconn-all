import { useEffect, useState } from 'react';
import type { DayDetail } from '@shared/types';

export interface DayQuery {
  detail: DayDetail | null;
  loading: boolean;
  error: string | null;
}

/** [00:00, next 00:00) in the viewer's own timezone, as ISO datetimes. */
export function dayRange(date: Date): { startISO: string; endISO: string } {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

/** Loads the signed-in employee's OWN screenshots and totals for one day. */
export default function useMyDay(date: Date): DayQuery {
  const [detail, setDetail] = useState<DayDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { startISO, endISO } = dayRange(date);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    window.tracker
      .getDay(startISO, endISO)
      .then((day) => {
        if (active) {
          setDetail(day);
          setLoading(false);
        }
      })
      .catch((cause: unknown) => {
        console.error('Failed to load day', cause);
        if (active) {
          setDetail(null);
          setError('Could not load this day. Check your connection and try again.');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [startISO, endISO]);

  return { detail, loading, error };
}

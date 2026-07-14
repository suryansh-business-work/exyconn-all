import { useEffect, useState } from 'react';
import type { DayDetail } from '@shared/types';
import { dayBounds } from '../time';

export interface DayQuery {
  detail: DayDetail | null;
  loading: boolean;
  error: string | null;
}

/**
 * One day of the employee's OWN work, for an explicit pair of instants. The screenshot gallery
 * (a separate window, handed its bounds in its URL) uses this directly; the report screen goes
 * through `useMyDay` below, which derives the bounds from the calendar date that was clicked.
 */
export function useDayDetail(startISO: string, endISO: string): DayQuery {
  const [detail, setDetail] = useState<DayDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

/**
 * Loads the signed-in employee's OWN screenshots and totals for one day.
 *
 * The day runs midnight-to-midnight in the employee's CHOSEN zone, not this computer's. For
 * someone whose zone is ahead of their laptop's, the device's midnight falls in the middle of
 * their working day — so the day they clicked would have been served to them cut in half.
 */
export default function useMyDay(date: Date, zone: string): DayQuery {
  const { startISO, endISO } = dayBounds(date, zone);
  return useDayDetail(startISO, endISO);
}

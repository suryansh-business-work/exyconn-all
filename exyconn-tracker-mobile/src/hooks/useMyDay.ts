import { useCallback, useEffect, useState } from 'react';
import { dayBounds, type DayDetail } from '@exyconn/tracker-core';
import { tracker } from '../tracker/instance';

export interface DayQuery {
  detail: DayDetail | null;
  loading: boolean;
  error: string | null;
  /** Asks the portal again — pull-to-refresh, the phone's "try again". */
  reload: () => void;
}

/**
 * One day of the employee's OWN work, for an explicit pair of instants. The screenshot gallery
 * (a route handed its bounds as params) uses this directly; the report screen goes through
 * `useMyDay` below, which derives the bounds from the calendar date that was tapped.
 */
export function useDayDetail(startISO: string, endISO: string): DayQuery {
  const [detail, setDetail] = useState<DayDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    tracker
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
  }, [startISO, endISO, attempt]);

  const reload = useCallback(() => setAttempt((count) => count + 1), []);

  return { detail, loading, error, reload };
}

/**
 * Loads the signed-in employee's OWN screenshots and totals for one day.
 *
 * The day runs midnight-to-midnight in the employee's CHOSEN zone, not this phone's. For
 * someone whose zone is ahead of their phone's, the device's midnight falls in the middle of
 * their working day — so the day they tapped would have been served to them cut in half.
 */
export function useMyDay(date: Date, zone: string): DayQuery {
  const { startISO, endISO } = dayBounds(date, zone);
  return useDayDetail(startISO, endISO);
}

import { useEffect, useState } from 'react';
import { dayBounds, type DayDetail } from '@exyconn/tracker-core';
import { tracker } from '../tracker/instance';
import { useReload } from './useReload';

export interface DayQuery {
  detail: DayDetail | null;
  /** True until the first answer for this day (or the next read of it) — the skeletons' cue. */
  loading: boolean;
  /** True while a pull-to-refresh re-reads a day already on screen. */
  refreshing: boolean;
  error: string | null;
  /** Asks the portal again — pull-to-refresh, the phone's "try again". */
  reload: () => void;
}

/**
 * One day of the employee's OWN work, for an explicit pair of instants. The screenshot gallery
 * (a route handed its bounds as params) uses this directly; the report screen goes through
 * `useMyDay` below, which derives the bounds from the calendar date that was tapped.
 */
export function useDayDetail(
  startISO: string,
  endISO: string,
  /** A new value re-reads the day — today's chart passes the last sync, which adds intervals. */
  refreshKey: string | null = null,
): DayQuery {
  const [detail, setDetail] = useState<DayDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { attempt, reload, isReload } = useReload();

  useEffect(() => {
    let active = true;
    if (isReload(attempt)) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    tracker
      .getDay(startISO, endISO)
      .then((day) => {
        if (active) {
          setDetail(day);
          setLoading(false);
          setRefreshing(false);
        }
      })
      .catch((cause: unknown) => {
        console.error('Failed to load day', cause);
        if (active) {
          setDetail(null);
          setError('Could not load this day. Check your connection and try again.');
          setLoading(false);
          setRefreshing(false);
        }
      });
    return () => {
      active = false;
    };
  }, [startISO, endISO, attempt, refreshKey, isReload]);

  return { detail, loading, refreshing, error, reload };
}

/**
 * Loads the signed-in employee's OWN screenshots and totals for one day.
 *
 * The day runs midnight-to-midnight in the employee's CHOSEN zone, not this phone's. For
 * someone whose zone is ahead of their phone's, the device's midnight falls in the middle of
 * their working day — so the day they tapped would have been served to them cut in half.
 */
export function useMyDay(date: Date, zone: string, refreshKey: string | null = null): DayQuery {
  const { startISO, endISO } = dayBounds(date, zone);
  return useDayDetail(startISO, endISO, refreshKey);
}

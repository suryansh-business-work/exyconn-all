import { useEffect, useState } from 'react';
import { LOCATION_POLL_MS, todayKeyIn, type TrackerLocationPin } from '@exyconn/tracker-core';
import { tracker } from '../tracker/instance';

export interface LocationsQuery {
  pins: TrackerLocationPin[];
  /** True until the first answer — the card's spinner. */
  loading: boolean;
  /** The last read failed; the card words it, so the sentence can be translated. */
  failed: boolean;
}

/**
 * The employee's own location pins for today, in their chosen zone. Read again once attendance
 * is marked (that is the first pin) and every five minutes while tracking, which is when the
 * controller may have sent a new one.
 */
export function useTodayLocations(
  zone: string,
  attendanceMarked: boolean,
  tracking: boolean,
): LocationsQuery {
  const [pins, setPins] = useState<TrackerLocationPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!tracking) {
      return undefined;
    }
    const timer = setInterval(() => setTick((count) => count + 1), LOCATION_POLL_MS);
    return () => clearInterval(timer);
  }, [tracking]);

  useEffect(() => {
    let active = true;
    tracker
      .getLocations(todayKeyIn(zone))
      .then((next) => {
        if (active) {
          setPins(next);
          setFailed(false);
          setLoading(false);
        }
      })
      .catch((cause: unknown) => {
        console.error('Failed to load today’s locations', cause);
        if (active) {
          setFailed(true);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [zone, attendanceMarked, tick]);

  return { pins, loading, failed };
}

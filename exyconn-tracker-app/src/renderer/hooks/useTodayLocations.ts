import { useEffect, useState } from 'react';
import { LOCATION_POLL_MS, todayKeyIn } from '@exyconn/tracker-core';
import type { TrackerLocationPin } from '@shared/types';
import usePortalRead, { type PortalRead } from './usePortalRead';

/**
 * Today's location pins, in the employee's own zone. Re-read when attendance is marked (that
 * sends the first pin) and, while tracking, on the same five-minute beat the move check runs
 * on — so a new pin shows up within one check of being sent.
 */
export default function useTodayLocations(
  timezone: string,
  tracking: boolean,
  attendanceMarked: boolean,
): PortalRead<TrackerLocationPin[]> {
  const [beat, setBeat] = useState(0);
  const date = todayKeyIn(timezone);

  useEffect(() => {
    if (!tracking) {
      return undefined;
    }
    const timer = setInterval(() => setBeat((count) => count + 1), LOCATION_POLL_MS);
    return () => clearInterval(timer);
  }, [tracking]);

  return usePortalRead(
    () => globalThis.tracker.getLocations(date),
    `${date}|${String(attendanceMarked)}|${beat}`,
    'today’s locations',
  );
}

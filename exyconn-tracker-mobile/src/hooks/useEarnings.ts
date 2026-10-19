import { useEffect, useState } from 'react';
import { dayBounds, monthBounds, zonedToday, type TrackerEarnings } from '@exyconn/tracker-core';
import { tracker } from '../tracker/instance';

export interface EarningsQuery {
  today: TrackerEarnings | null;
  month: TrackerEarnings | null;
  /** The last read failed; the card words it. The last good figures stay. */
  failed: boolean;
}

/**
 * Today's and this month's tracked time priced at the employee's rate, in their chosen zone.
 * Read again whenever a sync lands, since that is when tracked time grows. A failure is logged
 * and reported; the last good answer stays on screen, as on the desktop.
 */
export function useEarnings(zone: string, refreshKey: string | null): EarningsQuery {
  const [earnings, setEarnings] = useState<EarningsQuery>({
    today: null,
    month: null,
    failed: false,
  });

  useEffect(() => {
    let active = true;
    const day = zonedToday(zone);
    const { startISO, endISO } = dayBounds(day, zone);
    const { fromISO, toISO } = monthBounds(day, zone);
    Promise.all([tracker.getEarnings(startISO, endISO), tracker.getEarnings(fromISO, toISO)])
      .then(([today, month]) => {
        if (active) {
          setEarnings({ today, month, failed: false });
        }
      })
      .catch((cause: unknown) => {
        console.error('Failed to load earnings', cause);
        if (active) {
          setEarnings((last) => ({ ...last, failed: true }));
        }
      });
    return () => {
      active = false;
    };
  }, [zone, refreshKey]);

  return earnings;
}

import { useEffect, useState } from 'react';
import { autoStopNotice } from '@exyconn/tracker-core';
import type { TrackerSettings, TrackerStatus } from '@exyconn/tracker-core';
import { Notice } from '../ui/Notice';

interface Props {
  settings: TrackerSettings | null;
  timezone: string;
  status: TrackerStatus;
}

/** How often the countdown is recomputed — twice inside the minute the message is written in. */
const TICK_MS = 30_000;

/**
 * Tells the employee when their workspace will stop logging their time, and warns them as
 * that moment arrives.
 *
 * The schedule stops a session on the hour whether or not anybody is still working, and the
 * only thing worse than being stopped is being stopped without knowing — an afternoon of work
 * that never reached a timesheet is discovered days later. Renders nothing at all when the
 * workspace runs no schedule.
 */
export function AutoStopNotice({ settings, timezone, status }: Readonly<Props>) {
  // Recomputed on a timer, not just on state changes: the whole point is a countdown.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const notice = autoStopNotice(settings, timezone, status, now);
  if (notice === null) {
    return null;
  }
  return (
    <Notice severity={notice.severity} detail={notice.detail}>
      {notice.title}
    </Notice>
  );
}

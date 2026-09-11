import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { Alert, Stack, TRACKER_RADIUS, Typography } from '@exyconn/ui';
import type { TrackerSettings, TrackerStatus } from '@shared/types';
import { autoStopNotice } from '@exyconn/tracker-core';

interface Props {
  settings: TrackerSettings | null;
  timezone: string;
  status: TrackerStatus;
}

/** How often the countdown is recomputed. A minute is the resolution the message is written in. */
const TICK_MS = 30_000;

/**
 * Tells the employee when their workspace will stop logging their time, and warns them as
 * that moment arrives.
 *
 * The schedule stops a session on the hour whether or not anybody is still working, and the
 * only thing worse than being stopped is being stopped without knowing — an afternoon of work
 * that never reached a timesheet is discovered days later, by which time nobody can reconstruct
 * it. Renders nothing at all when the workspace runs no schedule.
 */
export default function AutoStopNotice({
  settings,
  timezone,
  status,
}: Readonly<Props>): ReactElement | null {
  // Recomputed on a timer, not just on state changes: the whole point is a countdown, and
  // nothing else in this app changes once the employee is simply working.
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
    <Alert
      severity={notice.severity}
      variant="outlined"
      sx={{ borderRadius: `${TRACKER_RADIUS}px` }}
    >
      <Stack spacing={0.25}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
          }}
        >
          {notice.title}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
          }}
        >
          {notice.detail}
        </Typography>
      </Stack>
    </Alert>
  );
}

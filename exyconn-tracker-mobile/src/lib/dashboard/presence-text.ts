import { formatElapsed, formatTimeOfDay, isAwayPresence } from '@exyconn/tracker-core';
import type { PresenceState, Translate } from '@exyconn/tracker-core';

/** "Since 12:30 PM · 24m ago" — when they said it, in their own zone, and how long ago. */
function sinceLabel(t: Translate, presence: PresenceState, timezone: string, now: number): string {
  if (presence.since === null) {
    return t('Tracking runs as normal.');
  }
  const at = new Date(presence.since).getTime();
  if (Number.isNaN(at)) {
    return '';
  }
  return t('Since {time} · {elapsed}', {
    time: formatTimeOfDay(presence.since, timezone),
    elapsed: formatElapsed(now - at),
  });
}

/**
 * The line under the presence picker. Anything but Working pauses the session, and it says so
 * — a tracker that kept counting through lunch would put lunch on a timesheet.
 */
export function presenceCaption(
  t: Translate,
  presence: PresenceState,
  timezone: string,
  now: number,
): string {
  const since = sinceLabel(t, presence, timezone, now);
  if (isAwayPresence(presence.status)) {
    return t('{since} — tracking stays paused until you are back on Working.', { since });
  }
  return since;
}

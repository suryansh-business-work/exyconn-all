import { formatElapsed, formatTimeOfDay, isAwayPresence } from '@exyconn/tracker-core';
import type { PresenceState } from '@exyconn/tracker-core';

/** "Since 12:30 PM · 24m ago" — when they said it, in their own zone, and how long ago. */
function sinceLabel(presence: PresenceState, timezone: string, now: number): string {
  if (presence.since === null) {
    return 'Tracking runs as normal.';
  }
  const at = new Date(presence.since).getTime();
  if (Number.isNaN(at)) {
    return '';
  }
  return `Since ${formatTimeOfDay(presence.since, timezone)} · ${formatElapsed(now - at)}`;
}

/**
 * The line under the presence picker. Anything but Working pauses the session, and it says so
 * — a tracker that kept counting through lunch would put lunch on a timesheet.
 */
export function presenceCaption(presence: PresenceState, timezone: string, now: number): string {
  const since = sinceLabel(presence, timezone, now);
  if (isAwayPresence(presence.status)) {
    return `${since} — tracking stays paused until you are back on Working.`;
  }
  return since;
}

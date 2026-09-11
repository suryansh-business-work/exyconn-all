import { activityPercent, formatCount, formatHoursMinutes } from '@exyconn/tracker-core';
import type { TrackerTotals } from '@exyconn/tracker-core';
import type { Capabilities } from '../../tracker/types';
import type { Tile } from './tile.types';

const NO_SESSIONS = 'No sessions yet';

/** Mean length of a session, counting active and idle time alike. */
function averageSession(totals: TrackerTotals): string {
  if (totals.sessions === 0) {
    return NO_SESSIONS;
  }
  return formatHoursMinutes((totals.activeMs + totals.idleMs) / totals.sessions);
}

/** Mean number of screenshots per session — the honest read of "how often am I captured". */
function screenshotsPerSession(totals: TrackerTotals): string {
  if (totals.sessions === 0) {
    return NO_SESSIONS;
  }
  return `${Math.round(totals.screenshots / totals.sessions)} per session`;
}

/**
 * Where the all-time screenshots came from. The total spans every device, so on an iPhone —
 * which takes none — the number is the employee's computers', and it says so.
 */
function screenshotsNote(capabilities: Capabilities): string {
  const where =
    'Every screenshot ever taken of your screen, and you can see all of them: open My report and pick a day.';
  if (capabilities.screenshots) {
    return where;
  }
  return `${where} This iPhone takes none — these come from your other devices.`;
}

/**
 * ALL TIME, from the portal — every session on every device this employee has ever tracked on.
 * Hours and minutes, not "1247h 3m 12s": nobody reads seconds off a lifetime total.
 */
export function totalTiles(totals: TrackerTotals, capabilities: Capabilities): Tile[] {
  const share = activityPercent(totals.activeMs, totals.idleMs);
  const across = `${formatCount(totals.sessions)} sessions`;
  return [
    {
      id: 'total-worked',
      label: 'Total worked',
      value: formatHoursMinutes(totals.activeMs),
      icon: 'history',
      detail: {
        headline: formatHoursMinutes(totals.activeMs),
        facts: [
          { id: 'share', label: 'Active share', value: `${share}%` },
          { id: 'sessions', label: 'Across', value: across },
          { id: 'average', label: 'Average session', value: averageSession(totals) },
        ],
        note: 'Every session on every device you have ever tracked on, as the portal holds it. It never resets, and it only moves when a sync lands.',
      },
    },
    {
      id: 'total-idle',
      label: 'Total idle',
      value: formatHoursMinutes(totals.idleMs),
      icon: 'timer-sand-empty',
      detail: {
        headline: formatHoursMinutes(totals.idleMs),
        facts: [
          { id: 'share', label: 'Idle share', value: `${100 - share}%` },
          {
            id: 'worked',
            label: 'Worked alongside it',
            value: formatHoursMinutes(totals.activeMs),
          },
        ],
        note: 'Time inside a tracking session when the device was not in use — no keyboard or mouse input on a computer, the screen off or the tracker closed on a phone. It is not time off — stopping or pausing records nothing at all.',
      },
    },
    {
      id: 'total-screenshots',
      label: 'Screenshots',
      value: formatCount(totals.screenshots),
      icon: 'image-multiple-outline',
      detail: {
        headline: `${formatCount(totals.screenshots)} screenshots`,
        facts: [
          { id: 'rate', label: 'Typical', value: screenshotsPerSession(totals) },
          { id: 'sessions', label: 'Across', value: across },
        ],
        note: screenshotsNote(capabilities),
      },
    },
    {
      id: 'total-sessions',
      label: 'Sessions',
      value: formatCount(totals.sessions),
      icon: 'play-circle-outline',
      detail: {
        headline: across,
        facts: [
          { id: 'average', label: 'Average length', value: averageSession(totals) },
          { id: 'worked', label: 'Total worked', value: formatHoursMinutes(totals.activeMs) },
        ],
        note: 'One session is one run of tracking, from Start to Stop. Pausing does not end a session.',
      },
    },
  ];
}

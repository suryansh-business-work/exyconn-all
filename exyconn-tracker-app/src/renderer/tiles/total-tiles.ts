import CollectionsOutlined from '@mui/icons-material/CollectionsOutlined';
import HistoryOutlined from '@mui/icons-material/HistoryOutlined';
import HourglassEmptyOutlined from '@mui/icons-material/HourglassEmptyOutlined';
import PlayCircleOutlined from '@mui/icons-material/PlayCircleOutlined';
import type { TrackerTotals } from '@shared/types';
import { formatCount, formatHoursMinutes } from '../format';
import type { Tile } from './tile.types';

/** Active share of everything ever tracked, as a whole percentage. */
function activeShare(totals: TrackerTotals): number {
  const total = totals.activeMs + totals.idleMs;
  if (total <= 0) {
    return 0;
  }
  return Math.round((totals.activeMs / total) * 100);
}

/** Mean length of a session, counting active and idle time alike. */
function averageSession(totals: TrackerTotals): string {
  if (totals.sessions === 0) {
    return 'No sessions yet';
  }
  return formatHoursMinutes((totals.activeMs + totals.idleMs) / totals.sessions);
}

/** Mean number of screenshots per session — the honest read of "how often am I captured". */
function screenshotsPerSession(totals: TrackerTotals): string {
  if (totals.sessions === 0) {
    return 'No sessions yet';
  }
  return `${Math.round(totals.screenshots / totals.sessions)} per session`;
}

/**
 * ALL TIME, from the portal — every session on every device this employee has ever tracked on.
 * Hours and minutes, not "1247h 3m 12s": nobody reads seconds off a lifetime total.
 */
export function totalTiles(totals: TrackerTotals): Tile[] {
  return [
    {
      id: 'total-worked',
      label: 'Total worked',
      value: formatHoursMinutes(totals.activeMs),
      icon: HistoryOutlined,
      detail: {
        headline: formatHoursMinutes(totals.activeMs),
        facts: [
          { id: 'share', label: 'Active share', value: `${activeShare(totals)}%` },
          { id: 'sessions', label: 'Across', value: `${formatCount(totals.sessions)} sessions` },
          { id: 'average', label: 'Average session', value: averageSession(totals) },
        ],
        note: 'Every session on every device you have ever tracked on, as the portal holds it. It never resets, and it only moves when a sync lands.',
      },
    },
    {
      id: 'total-idle',
      label: 'Total idle',
      value: formatHoursMinutes(totals.idleMs),
      icon: HourglassEmptyOutlined,
      detail: {
        headline: formatHoursMinutes(totals.idleMs),
        facts: [
          { id: 'share', label: 'Idle share', value: `${100 - activeShare(totals)}%` },
          {
            id: 'worked',
            label: 'Worked alongside it',
            value: formatHoursMinutes(totals.activeMs),
          },
        ],
        note: 'Time inside a tracking session with no keyboard or mouse input. It is not time off — stopping or pausing records nothing at all.',
      },
    },
    {
      id: 'total-screenshots',
      label: 'Screenshots',
      value: formatCount(totals.screenshots),
      icon: CollectionsOutlined,
      detail: {
        headline: `${formatCount(totals.screenshots)} screenshots`,
        facts: [
          { id: 'rate', label: 'Typical', value: screenshotsPerSession(totals) },
          { id: 'sessions', label: 'Across', value: `${formatCount(totals.sessions)} sessions` },
        ],
        note: 'Every screenshot ever taken of your screen, and you can see all of them: open My report and pick a day.',
      },
    },
    {
      id: 'total-sessions',
      label: 'Sessions',
      value: formatCount(totals.sessions),
      icon: PlayCircleOutlined,
      detail: {
        headline: `${formatCount(totals.sessions)} sessions`,
        facts: [
          { id: 'average', label: 'Average length', value: averageSession(totals) },
          { id: 'worked', label: 'Total worked', value: formatHoursMinutes(totals.activeMs) },
        ],
        note: 'One session is one run of tracking, from Start to Stop. Pausing does not end a session.',
      },
    },
  ];
}

import type { SvgIconComponent } from '@mui/icons-material';
import AppsOutlined from '@mui/icons-material/AppsOutlined';
import CollectionsOutlined from '@mui/icons-material/CollectionsOutlined';
import HistoryOutlined from '@mui/icons-material/HistoryOutlined';
import HourglassEmptyOutlined from '@mui/icons-material/HourglassEmptyOutlined';
import KeyboardOutlined from '@mui/icons-material/KeyboardOutlined';
import MouseOutlined from '@mui/icons-material/MouseOutlined';
import PhotoCameraOutlined from '@mui/icons-material/PhotoCameraOutlined';
import PlayCircleOutlined from '@mui/icons-material/PlayCircleOutlined';
import TimerOutlined from '@mui/icons-material/TimerOutlined';
import type { LiveStats, TrackerTotals } from '@shared/types';
import { formatClock, formatCount, formatHoursMinutes } from './format';

export interface Tile {
  id: string;
  label: string;
  value: string;
  icon: SvgIconComponent;
}

/**
 * THIS SESSION. Every one of these resets to zero the moment tracking stops — they are the
 * live counters of the run in progress, and nothing more.
 */
export function sessionTiles(stats: LiveStats): Tile[] {
  return [
    {
      id: 'worked',
      label: 'Worked',
      value: formatClock(stats.sessionActiveMs),
      icon: TimerOutlined,
    },
    {
      id: 'idle',
      label: 'Idle',
      value: formatClock(stats.sessionIdleMs),
      icon: HourglassEmptyOutlined,
    },
    {
      id: 'keys',
      label: 'Key presses',
      value: formatCount(stats.keyCount),
      icon: KeyboardOutlined,
    },
    {
      id: 'mouse',
      label: 'Mouse clicks',
      value: formatCount(stats.mouseCount),
      icon: MouseOutlined,
    },
    { id: 'app', label: 'Current app', value: stats.currentApp || '—', icon: AppsOutlined },
    {
      id: 'screenshots',
      label: 'Screenshots',
      value: formatCount(stats.screenshotCount),
      icon: PhotoCameraOutlined,
    },
  ];
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
    },
    {
      id: 'total-idle',
      label: 'Total idle',
      value: formatHoursMinutes(totals.idleMs),
      icon: HourglassEmptyOutlined,
    },
    {
      id: 'total-screenshots',
      label: 'Screenshots',
      value: formatCount(totals.screenshots),
      icon: CollectionsOutlined,
    },
    {
      id: 'total-sessions',
      label: 'Sessions',
      value: formatCount(totals.sessions),
      icon: PlayCircleOutlined,
    },
  ];
}

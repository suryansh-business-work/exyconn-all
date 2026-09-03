import AppsOutlined from '@mui/icons-material/AppsOutlined';
import HourglassEmptyOutlined from '@mui/icons-material/HourglassEmptyOutlined';
import KeyboardOutlined from '@mui/icons-material/KeyboardOutlined';
import MouseOutlined from '@mui/icons-material/MouseOutlined';
import PhotoCameraOutlined from '@mui/icons-material/PhotoCameraOutlined';
import TimerOutlined from '@mui/icons-material/TimerOutlined';
import type { LiveStats, TrackerSettings } from '@shared/types';
import { formatClock, formatCount } from '../format';
import type { Tile } from './tile.types';

const onOff = (value: boolean): string => (value ? 'On' : 'Off');

/** Share of the session spent active, as a whole percentage. */
function activeShare(stats: LiveStats): number {
  const total = stats.sessionActiveMs + stats.sessionIdleMs;
  if (total <= 0) {
    return 0;
  }
  return Math.round((stats.sessionActiveMs / total) * 100);
}

/** Events per minute of ACTIVE time — idle minutes would flatter the rate into meaninglessness. */
function perMinute(count: number, activeMs: number): string {
  if (activeMs < 60_000) {
    return 'Not enough time yet';
  }
  return `${Math.round(count / (activeMs / 60_000))} per active minute`;
}

/** Minutes and seconds, for a detail line where the tile shows a rounded clock. */
function exact(ms: number): string {
  const seconds = Math.round(ms / 1000);
  return `${formatClock(ms)} (${formatCount(seconds)} seconds)`;
}

function workedTile(stats: LiveStats, settings: TrackerSettings | null): Tile {
  return {
    id: 'worked',
    label: 'Worked',
    value: formatClock(stats.sessionActiveMs),
    icon: TimerOutlined,
    detail: {
      headline: exact(stats.sessionActiveMs),
      facts: [
        { id: 'share', label: 'Share of this session', value: `${activeShare(stats)}% active` },
        { id: 'idle', label: 'Idle alongside it', value: formatClock(stats.sessionIdleMs) },
        {
          id: 'threshold',
          label: 'Counts as idle after',
          value: settings ? `${formatCount(settings.idleThresholdSeconds)} seconds` : 'Unknown',
        },
      ],
      note: 'Worked time is every second you were at the keyboard while tracking was running. It resets to zero when you stop.',
    },
  };
}

function idleTile(stats: LiveStats, settings: TrackerSettings | null): Tile {
  return {
    id: 'idle',
    label: 'Idle',
    value: formatClock(stats.sessionIdleMs),
    icon: HourglassEmptyOutlined,
    detail: {
      headline: exact(stats.sessionIdleMs),
      facts: [
        { id: 'share', label: 'Share of this session', value: `${100 - activeShare(stats)}% idle` },
        {
          id: 'threshold',
          label: 'Idle begins after',
          value: settings ? `${formatCount(settings.idleThresholdSeconds)} seconds` : 'Unknown',
        },
      ],
      note: 'Idle is time with no keyboard or mouse input at all. Screenshots and app usage are still recorded while idle — pause tracking if you are stepping away.',
    },
  };
}

function keysTile(stats: LiveStats): Tile {
  return {
    id: 'keys',
    label: 'Key presses',
    value: formatCount(stats.keyCount),
    icon: KeyboardOutlined,
    detail: {
      headline: `${formatCount(stats.keyCount)} key presses`,
      facts: [
        { id: 'rate', label: 'Rate', value: perMinute(stats.keyCount, stats.sessionActiveMs) },
        { id: 'clicks', label: 'Mouse clicks', value: formatCount(stats.mouseCount) },
      ],
      note: 'A count, and nothing else. The tracker never records which keys you press or what you type — the key itself is discarded the instant the counter goes up.',
    },
  };
}

function mouseTile(stats: LiveStats): Tile {
  return {
    id: 'mouse',
    label: 'Mouse clicks',
    value: formatCount(stats.mouseCount),
    icon: MouseOutlined,
    detail: {
      headline: `${formatCount(stats.mouseCount)} mouse clicks`,
      facts: [
        { id: 'rate', label: 'Rate', value: perMinute(stats.mouseCount, stats.sessionActiveMs) },
        { id: 'keys', label: 'Key presses', value: formatCount(stats.keyCount) },
      ],
      note: 'A count of clicks only. Where you clicked, and what you clicked on, are never recorded.',
    },
  };
}

function appTile(stats: LiveStats, settings: TrackerSettings | null): Tile {
  return {
    id: 'app',
    label: 'Current app',
    value: stats.currentApp || '—',
    icon: AppsOutlined,
    detail: {
      headline: stats.currentApp || 'Nothing in the foreground',
      facts: [
        {
          id: 'titles',
          label: 'Window titles recorded',
          value: settings ? onOff(settings.trackWindowTitles) : 'Unknown',
        },
      ],
      note: 'Your workspace sees how long each application was in the foreground. Window titles are recorded only when the setting above says so.',
    },
  };
}

function screenshotTile(stats: LiveStats, settings: TrackerSettings | null): Tile {
  const perInterval = settings?.screenshotsPerInterval ?? 0;
  return {
    id: 'screenshots',
    label: 'Screenshots',
    value: formatCount(stats.screenshotCount),
    icon: PhotoCameraOutlined,
    detail: {
      headline: `${formatCount(stats.screenshotCount)} this session`,
      facts: [
        {
          id: 'cadence',
          label: 'Captured',
          value: settings
            ? `${formatCount(perInterval)} per ${formatCount(settings.intervalMinutes)} minutes`
            : 'Unknown',
        },
        {
          id: 'timing',
          label: 'Timing',
          value: settings?.randomizeScreenshotTiming ? 'At a random moment' : 'At the interval',
        },
        { id: 'blur', label: 'Blurred', value: settings ? onOff(settings.blurScreenshots) : '—' },
        {
          id: 'webcam',
          label: 'Webcam photo',
          value: settings ? onOff(settings.webcamEnabled) : '—',
        },
      ],
      note: 'Every capture is announced as it happens, with a notification showing the shot itself and an audible shutter. You can review all of them from My report.',
    },
  };
}

/**
 * THIS SESSION. Every one of these resets to zero the moment tracking stops — they are the
 * live counters of the run in progress, and nothing more.
 */
export function sessionTiles(stats: LiveStats, settings: TrackerSettings | null): Tile[] {
  return [
    workedTile(stats, settings),
    idleTile(stats, settings),
    keysTile(stats),
    mouseTile(stats),
    appTile(stats, settings),
    screenshotTile(stats, settings),
  ];
}

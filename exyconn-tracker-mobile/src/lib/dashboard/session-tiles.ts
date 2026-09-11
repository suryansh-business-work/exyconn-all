import { activityPercent, formatClock, formatCount } from '@exyconn/tracker-core';
import type { LiveStats, TrackerSettings } from '@exyconn/tracker-core';
import type { Capabilities } from '../../tracker/types';
import { appTile, screenshotTile } from './device-tiles';
import type { Tile } from './tile.types';

/** Minutes and seconds, for a detail line where the tile shows a rounded clock. */
function exact(ms: number): string {
  const seconds = Math.round(ms / 1000);
  return `${formatClock(ms)} (${formatCount(seconds)} seconds)`;
}

/** The workspace's idle threshold, or an honest "Unknown" before settings have loaded. */
function idleThreshold(settings: TrackerSettings | null): string {
  return settings ? `${formatCount(settings.idleThresholdSeconds)} seconds` : 'Unknown';
}

/**
 * What "worked" means on this phone. The desktop's rule is "at the keyboard"; a phone that runs
 * in the background reads its screen and lock state, and an iPhone sees only the tracker itself.
 */
function workedRule(capabilities: Capabilities): string {
  if (capabilities.background) {
    return 'Worked time is every second your phone was in use — screen on and unlocked — while tracking was running.';
  }
  return 'Worked time is every second the tracker was open on your screen while tracking was running — iPhone shows it nothing else.';
}

function idleRule(capabilities: Capabilities): string {
  if (capabilities.background) {
    return 'Idle is time with the screen off or the phone locked. Screenshots and app usage are still recorded while idle — pause tracking if you are stepping away.';
  }
  return 'Idle is time the tracker was not on your screen. The session keeps running while idle — pause tracking if you are stepping away.';
}

function workedTile(stats: LiveStats, settings: TrackerSettings | null, caps: Capabilities): Tile {
  const share = activityPercent(stats.sessionActiveMs, stats.sessionIdleMs);
  return {
    id: 'worked',
    label: 'Worked',
    value: formatClock(stats.sessionActiveMs),
    icon: 'timer-outline',
    detail: {
      headline: exact(stats.sessionActiveMs),
      facts: [
        { id: 'share', label: 'Share of this session', value: `${share}% active` },
        { id: 'idle', label: 'Idle alongside it', value: formatClock(stats.sessionIdleMs) },
        { id: 'threshold', label: 'Counts as idle after', value: idleThreshold(settings) },
      ],
      note: `${workedRule(caps)} It resets to zero when you stop.`,
    },
  };
}

function idleTile(stats: LiveStats, settings: TrackerSettings | null, caps: Capabilities): Tile {
  const share = activityPercent(stats.sessionActiveMs, stats.sessionIdleMs);
  return {
    id: 'idle',
    label: 'Idle',
    value: formatClock(stats.sessionIdleMs),
    icon: 'timer-sand-empty',
    detail: {
      headline: exact(stats.sessionIdleMs),
      facts: [
        { id: 'share', label: 'Share of this session', value: `${100 - share}% idle` },
        { id: 'threshold', label: 'Idle begins after', value: idleThreshold(settings) },
      ],
      note: idleRule(caps),
    },
  };
}

/**
 * The desktop's key-press and mouse-click tiles, answered honestly: a phone can count neither,
 * so one tile says so instead of two tiles showing a zero that would read as a measurement.
 */
function inputTile(): Tile {
  return {
    id: 'input',
    label: 'Keys & taps',
    value: 'Not measured',
    icon: 'keyboard-off-outline',
    detail: {
      headline: 'Not measured on a phone',
      facts: [
        { id: 'keys', label: 'Key presses', value: 'Not measured' },
        { id: 'taps', label: 'Taps', value: 'Not measured' },
      ],
      note: 'A phone lets no app count the keys you press or the taps you make in other apps, so this tracker counts neither. Nothing about your typing or tapping is recorded from this phone.',
    },
  };
}

/**
 * THIS SESSION. Every one of these resets to zero the moment tracking stops — they are the
 * live counters of the run in progress, and nothing more.
 */
export function sessionTiles(
  stats: LiveStats,
  settings: TrackerSettings | null,
  capabilities: Capabilities,
): Tile[] {
  return [
    workedTile(stats, settings, capabilities),
    idleTile(stats, settings, capabilities),
    inputTile(),
    appTile(stats, capabilities),
    screenshotTile(stats, settings, capabilities),
  ];
}

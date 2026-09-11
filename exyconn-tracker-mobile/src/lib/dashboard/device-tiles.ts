import { formatCount } from '@exyconn/tracker-core';
import type { LiveStats, TrackerSettings } from '@exyconn/tracker-core';
import type { Capabilities } from '../../tracker/types';
import type { Tile } from './tile.types';

const onOff = (value: boolean): string => (value ? 'On' : 'Off');

/**
 * The app in front — Android reads it from usage access; iOS lets no app see another, so the
 * tile says that rather than showing a blank that looks like "nothing was open".
 */
export function appTile(stats: LiveStats, capabilities: Capabilities): Tile {
  if (!capabilities.foregroundApp) {
    return {
      id: 'app',
      label: 'App in front',
      value: 'Not available',
      icon: 'apps',
      detail: {
        headline: "iPhone doesn't let apps see other apps",
        facts: [{ id: 'recorded', label: 'App usage recorded', value: 'None' }],
        note: 'Apple lets no app see which other app is open, so this iPhone records no app usage at all — only the time the tracker itself is on screen.',
      },
    };
  }
  return {
    id: 'app',
    label: 'App in front',
    value: stats.currentApp || '—',
    icon: 'apps',
    detail: {
      headline: stats.currentApp || 'Nothing in front',
      facts: [{ id: 'titles', label: 'Window titles recorded', value: 'None on a phone' }],
      note: 'Your workspace sees how long each app was in front, by its name. A phone has no window titles, so nothing inside an app is recorded.',
    },
  };
}

/** "2 per 10 minutes", or "Unknown" before the workspace settings have loaded. */
function cadence(settings: TrackerSettings | null): string {
  if (!settings) {
    return 'Unknown';
  }
  return `${formatCount(settings.screenshotsPerInterval)} per ${formatCount(settings.intervalMinutes)} minutes`;
}

/**
 * Screenshots this session. iOS allows no app to capture the screen, so an iPhone takes none —
 * said in words, because "0" would read as "none were due yet".
 */
export function screenshotTile(
  stats: LiveStats,
  settings: TrackerSettings | null,
  capabilities: Capabilities,
): Tile {
  if (!capabilities.screenshots) {
    return {
      id: 'screenshots',
      label: 'Screenshots',
      value: 'None on iPhone',
      icon: 'camera-off-outline',
      detail: {
        headline: "iPhone doesn't allow screenshots",
        facts: [{ id: 'taken', label: 'Taken on this iPhone', value: 'None' }],
        note: 'Apple lets no app capture the screen, so this iPhone never takes a screenshot — even when your workspace takes them on your computer.',
      },
    };
  }
  return {
    id: 'screenshots',
    label: 'Screenshots',
    value: formatCount(stats.screenshotCount),
    icon: 'camera-outline',
    detail: {
      headline: `${formatCount(stats.screenshotCount)} this session`,
      facts: [
        { id: 'cadence', label: 'Captured', value: cadence(settings) },
        {
          id: 'timing',
          label: 'Timing',
          value: settings?.randomizeScreenshotTiming ? 'At a random moment' : 'At the interval',
        },
        { id: 'blur', label: 'Blurred', value: settings ? onOff(settings.blurScreenshots) : '—' },
        {
          id: 'webcam',
          label: 'Camera photo',
          value: settings ? onOff(settings.webcamEnabled) : '—',
        },
      ],
      note: 'Every capture is announced as it happens, with a notification showing the shot itself and the capture sound. You can review all of them from My report.',
    },
  };
}

import type { TrackerSettings } from '@shared/types';

export interface SettingRow {
  id: string;
  label: string;
  value: string;
}

function plural(count: number, unit: string): string {
  return `${count} ${unit}${count === 1 ? '' : 's'}`;
}

function yesNo(value: boolean): string {
  return value ? 'On' : 'Off';
}

function syncPolicy(settings: TrackerSettings): string {
  if (!settings.autoSyncEnabled) {
    return 'Off — manual "Sync now" only';
  }
  return `Every ${plural(settings.syncIntervalMinutes, 'minute')}`;
}

/**
 * What the workspace has configured, in plain language. Read-only on purpose:
 * these are set by an admin in the portal, never from this app.
 */
export function buildSettingRows(settings: TrackerSettings): SettingRow[] {
  return [
    {
      id: 'interval',
      label: 'Tracking interval',
      value: plural(settings.intervalMinutes, 'minute'),
    },
    {
      id: 'screenshots',
      label: 'Screenshots per interval',
      value: plural(settings.screenshotsPerInterval, 'screenshot'),
    },
    {
      id: 'randomize',
      label: 'Randomised screenshot timing',
      value: yesNo(settings.randomizeScreenshotTiming),
    },
    { id: 'blur', label: 'Blur screenshots', value: yesNo(settings.blurScreenshots) },
    { id: 'titles', label: 'Record window titles', value: yesNo(settings.trackWindowTitles) },
    {
      id: 'idle',
      label: 'Idle after',
      value: plural(settings.idleThresholdSeconds, 'second'),
    },
    { id: 'sync', label: 'Auto-sync', value: syncPolicy(settings) },
  ];
}

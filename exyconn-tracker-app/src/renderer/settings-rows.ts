import type { TrackerSettings, WebcamCorner } from '@shared/types';

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

/** The quality dial, said out loud — 100 is not "100 of something", it is lossless. */
function qualityPolicy(settings: TrackerSettings): string {
  if (settings.screenshotQuality >= 100) {
    return '100% — full resolution, lossless';
  }
  return `${settings.screenshotQuality}% — up to ${settings.screenshotMaxWidth}px wide`;
}

/** Where the webcam photo lands, in the words the portal's own picker uses. */
const CORNER_LABEL: Record<WebcamCorner, string> = {
  'top-left': 'top left',
  'top-right': 'top right',
  'bottom-left': 'bottom left',
  'bottom-right': 'bottom right',
};

function webcamPolicy(settings: TrackerSettings): string {
  if (!settings.webcamEnabled) {
    return 'Off — no photo is taken';
  }
  return `On — shown in the ${CORNER_LABEL[settings.webcamCorner]} of each screenshot`;
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
    { id: 'quality', label: 'Screenshot quality', value: qualityPolicy(settings) },
    { id: 'blur', label: 'Blur screenshots', value: yesNo(settings.blurScreenshots) },
    { id: 'webcam', label: 'Webcam photo', value: webcamPolicy(settings) },
    { id: 'titles', label: 'Record window titles', value: yesNo(settings.trackWindowTitles) },
    {
      id: 'idle',
      label: 'Idle after',
      value: plural(settings.idleThresholdSeconds, 'second'),
    },
    { id: 'sync', label: 'Auto-sync', value: syncPolicy(settings) },
  ];
}

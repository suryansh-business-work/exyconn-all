import type { TrackerSettings, WebcamCorner } from './types';
import { formatHourLabel } from './schedule';

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

/** When the app stops on its own, said the way the employee experiences it. */
function autoPausePolicy(settings: TrackerSettings): string {
  if (settings.idleAutoPauseMinutes <= 0) {
    return 'Never — tracking runs until you stop it';
  }
  return `After ${plural(settings.idleAutoPauseMinutes, 'minute')} with no activity`;
}

/** Whether a capture is announced out loud, and by whose decision. */
function captureSoundPolicy(settings: TrackerSettings): string {
  if (settings.captureSoundEnabled) {
    return 'A shutter plays';
  }
  return 'Silent — you are still notified';
}

/**
 * The window the workspace tracks in, stated plainly.
 *
 * The stop hour is the one an employee most needs in front of them: after it, nothing they do
 * is logged, and finding that out from an empty timesheet is finding it out too late.
 */
function schedulePolicy(settings: TrackerSettings): string {
  if (!settings.autoStartEnabled) {
    return 'You start and stop it';
  }
  const start = formatHourLabel(settings.autoStartHour);
  const stop = formatHourLabel(settings.autoStopHour);
  // Just the window. What it COSTS to be outside it is the dashboard notice's job, and saying
  // it twice made this row long enough to need two lines of its own.
  return `${start} – ${stop}, then it stops`;
}

/** Uploading is automatic and always on; only the cadence is an administrator's choice. */
function syncPolicy(settings: TrackerSettings): string {
  return `Automatic, every ${plural(settings.syncIntervalMinutes, 'minute')}`;
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
    { id: 'auto-pause', label: 'Pauses itself', value: autoPausePolicy(settings) },
    { id: 'capture-sound', label: 'Screenshot sound', value: captureSoundPolicy(settings) },
    { id: 'schedule', label: 'Tracking hours', value: schedulePolicy(settings) },
    { id: 'sync', label: 'Upload', value: syncPolicy(settings) },
  ];
}

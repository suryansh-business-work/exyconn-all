import type { TrackerSettings, WebcamCorner } from './types';
import type { Translate } from './translate';
import { formatHourLabel } from './schedule';

export interface SettingRow {
  id: string;
  label: string;
  value: string;
}

/**
 * A count and its unit, as one whole sentence per number rather than an "s" glued on: a
 * language that inflects the noun with the number cannot be translated a suffix at a time.
 */
function minuteCount(t: Translate, count: number): string {
  if (count === 1) {
    return t('{count} minute', { count });
  }
  return t('{count} minutes', { count });
}

function secondCount(t: Translate, count: number): string {
  if (count === 1) {
    return t('{count} second', { count });
  }
  return t('{count} seconds', { count });
}

function screenshotCount(t: Translate, count: number): string {
  if (count === 1) {
    return t('{count} screenshot', { count });
  }
  return t('{count} screenshots', { count });
}

function yesNo(t: Translate, value: boolean): string {
  return value ? t('On') : t('Off');
}

/** The quality dial, said out loud — 100 is not "100 of something", it is lossless. */
function qualityPolicy(t: Translate, settings: TrackerSettings): string {
  if (settings.screenshotQuality >= 100) {
    return t('100% — full resolution, lossless');
  }
  return t('{quality}% — up to {width}px wide', {
    quality: settings.screenshotQuality,
    width: settings.screenshotMaxWidth,
  });
}

/**
 * Where the webcam photo lands, in the words the portal's own picker uses — one whole
 * sentence per corner, so a language that puts the place somewhere else in the clause still
 * has a string it can rewrite.
 */
const CORNER_POLICY: Record<WebcamCorner, string> = {
  'top-left': 'On — shown in the top left of each screenshot',
  'top-right': 'On — shown in the top right of each screenshot',
  'bottom-left': 'On — shown in the bottom left of each screenshot',
  'bottom-right': 'On — shown in the bottom right of each screenshot',
};

function webcamPolicy(t: Translate, settings: TrackerSettings): string {
  if (!settings.webcamEnabled) {
    return t('Off — no photo is taken');
  }
  return t(CORNER_POLICY[settings.webcamCorner]);
}

/** When the app stops on its own, said the way the employee experiences it. */
function autoPausePolicy(t: Translate, settings: TrackerSettings): string {
  const minutes = settings.idleAutoPauseMinutes;
  if (minutes <= 0) {
    return t('Never — tracking runs until you stop it');
  }
  if (minutes === 1) {
    return t('After {count} minute with no activity', { count: minutes });
  }
  return t('After {count} minutes with no activity', { count: minutes });
}

/** Whether a capture is announced out loud, and by whose decision. */
function captureSoundPolicy(t: Translate, settings: TrackerSettings): string {
  if (settings.captureSoundEnabled) {
    return t('A shutter plays');
  }
  return t('Silent — you are still notified');
}

/**
 * The window the workspace tracks in, stated plainly.
 *
 * The stop hour is the one an employee most needs in front of them: after it, nothing they do
 * is logged, and finding that out from an empty timesheet is finding it out too late.
 */
function schedulePolicy(t: Translate, settings: TrackerSettings): string {
  if (!settings.autoStartEnabled) {
    return t('You start and stop it');
  }
  // Just the window. What it COSTS to be outside it is the dashboard notice's job, and saying
  // it twice made this row long enough to need two lines of its own.
  return t('{start} – {stop}, then it stops', {
    start: formatHourLabel(settings.autoStartHour),
    stop: formatHourLabel(settings.autoStopHour),
  });
}

/** Uploading is automatic and always on; only the cadence is an administrator's choice. */
function syncPolicy(t: Translate, settings: TrackerSettings): string {
  const minutes = settings.syncIntervalMinutes;
  if (minutes === 1) {
    return t('Automatic, every {count} minute', { count: minutes });
  }
  return t('Automatic, every {count} minutes', { count: minutes });
}

/**
 * What the workspace has configured, in plain language. Read-only on purpose:
 * these are set by an admin in the portal, never from this app.
 */
export function buildSettingRows(t: Translate, settings: TrackerSettings): SettingRow[] {
  return [
    {
      id: 'interval',
      label: t('Tracking interval'),
      value: minuteCount(t, settings.intervalMinutes),
    },
    {
      id: 'screenshots',
      label: t('Screenshots per interval'),
      value: screenshotCount(t, settings.screenshotsPerInterval),
    },
    {
      id: 'randomize',
      label: t('Randomised screenshot timing'),
      value: yesNo(t, settings.randomizeScreenshotTiming),
    },
    { id: 'quality', label: t('Screenshot quality'), value: qualityPolicy(t, settings) },
    { id: 'blur', label: t('Blur screenshots'), value: yesNo(t, settings.blurScreenshots) },
    { id: 'webcam', label: t('Webcam photo'), value: webcamPolicy(t, settings) },
    {
      id: 'titles',
      label: t('Record window titles'),
      value: yesNo(t, settings.trackWindowTitles),
    },
    {
      id: 'idle',
      label: t('Idle after'),
      value: secondCount(t, settings.idleThresholdSeconds),
    },
    { id: 'auto-pause', label: t('Pauses itself'), value: autoPausePolicy(t, settings) },
    {
      id: 'capture-sound',
      label: t('Screenshot sound'),
      value: captureSoundPolicy(t, settings),
    },
    { id: 'schedule', label: t('Tracking hours'), value: schedulePolicy(t, settings) },
    { id: 'sync', label: t('Upload'), value: syncPolicy(t, settings) },
  ];
}

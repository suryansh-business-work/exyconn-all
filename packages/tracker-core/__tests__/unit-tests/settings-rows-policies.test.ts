import { describe, expect, it } from 'vitest';
import type { TrackerSettings } from '../../src/types';
import { buildSettingRows } from '../../src/settings-rows';
import { t } from './translator';

const SETTINGS: TrackerSettings = {
  intervalMinutes: 10,
  screenshotsPerInterval: 2,
  randomizeScreenshotTiming: true,
  blurScreenshots: false,
  trackWindowTitles: true,
  idleThresholdSeconds: 300,
  idleAutoPauseMinutes: 15,
  screenshotMaxWidth: 1600,
  screenshotQuality: 70,
  captureSoundEnabled: true,
  webcamEnabled: true,
  webcamCorner: 'top-left',
  syncIntervalMinutes: 5,
  autoStartEnabled: false,
  autoStartHour: 9,
  autoStopHour: 18,
  consentText: '<p>ok</p>',
};

function rows(settings: TrackerSettings): Record<string, string> {
  return Object.fromEntries(buildSettingRows(t, settings).map((row) => [row.id, row.value]));
}

describe('buildSettingRows — every row, in order', () => {
  it('lists the twelve settings the admin controls', () => {
    expect(buildSettingRows(t, SETTINGS).map((row) => row.id)).toEqual([
      'interval',
      'screenshots',
      'randomize',
      'quality',
      'blur',
      'webcam',
      'titles',
      'idle',
      'auto-pause',
      'capture-sound',
      'schedule',
      'sync',
    ]);
  });

  it('says plural counts as whole sentences', () => {
    const values = rows(SETTINGS);
    expect(values.interval).toBe('10 minutes');
    expect(values.screenshots).toBe('2 screenshots');
    expect(values.idle).toBe('300 seconds');
    expect(values['auto-pause']).toBe('After 15 minutes with no activity');
    expect(values.sync).toBe('Automatic, every 5 minutes');
  });

  it('says singular counts as their own sentences', () => {
    const values = rows({
      ...SETTINGS,
      intervalMinutes: 1,
      screenshotsPerInterval: 1,
      idleThresholdSeconds: 1,
      idleAutoPauseMinutes: 1,
      syncIntervalMinutes: 1,
    });
    expect(values.interval).toBe('1 minute');
    expect(values.screenshots).toBe('1 screenshot');
    expect(values.idle).toBe('1 second');
    expect(values['auto-pause']).toBe('After 1 minute with no activity');
    expect(values.sync).toBe('Automatic, every 1 minute');
  });

  it('reads switches as On and Off', () => {
    expect(rows(SETTINGS).randomize).toBe('On');
    expect(rows(SETTINGS).blur).toBe('Off');
    expect(rows({ ...SETTINGS, trackWindowTitles: false }).titles).toBe('Off');
  });

  it('states lossy quality with the width cap, and 100 as lossless', () => {
    expect(rows(SETTINGS).quality).toBe('70% — up to 1600px wide');
    expect(rows({ ...SETTINGS, screenshotQuality: 100 }).quality).toBe(
      '100% — full resolution, lossless',
    );
  });

  it('names the corner the webcam photo lands in, or that none is taken', () => {
    expect(rows(SETTINGS).webcam).toBe('On — shown in the top left of each screenshot');
    expect(rows({ ...SETTINGS, webcamCorner: 'bottom-left' }).webcam).toBe(
      'On — shown in the bottom left of each screenshot',
    );
    expect(rows({ ...SETTINGS, webcamEnabled: false }).webcam).toBe('Off — no photo is taken');
  });

  it('says tracking never pauses itself when the admin turned that off', () => {
    expect(rows({ ...SETTINGS, idleAutoPauseMinutes: 0 })['auto-pause']).toBe(
      'Never — tracking runs until you stop it',
    );
  });

  it('states the schedule window when one is set', () => {
    expect(rows({ ...SETTINGS, autoStartEnabled: true }).schedule).toBe(
      '9:00 AM – 6:00 PM, then it stops',
    );
  });
});

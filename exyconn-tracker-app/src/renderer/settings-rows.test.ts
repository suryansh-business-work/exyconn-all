import { describe, expect, it } from 'vitest';
import type { TrackerSettings } from '@shared/types';
import { buildSettingRows } from './settings-rows';

const SETTINGS: TrackerSettings = {
  intervalMinutes: 10,
  screenshotsPerInterval: 1,
  randomizeScreenshotTiming: true,
  blurScreenshots: false,
  trackWindowTitles: true,
  idleThresholdSeconds: 300,
  idleAutoPauseMinutes: 15,
  screenshotMaxWidth: 1600,
  screenshotQuality: 100,
  captureSoundEnabled: true,
  webcamEnabled: false,
  webcamCorner: 'bottom-right',
  syncIntervalMinutes: 5,
  autoStartEnabled: false,
  autoStartHour: 9,
  autoStopHour: 18,
  consentText: '<p>ok</p>',
};

/** The value the employee reads against one row label. */
function valueOf(settings: TrackerSettings, id: string): string {
  return buildSettingRows(settings).find((row) => row.id === id)?.value ?? '';
}

describe('buildSettingRows', () => {
  it('says a capture is announced out loud', () => {
    expect(valueOf(SETTINGS, 'capture-sound')).toContain('camera shutter');
  });

  it('promises a notification even where the workspace has muted the sound', () => {
    const value = valueOf({ ...SETTINGS, captureSoundEnabled: false }, 'capture-sound');

    expect(value).toContain('Off');
    // Muting must never read as "you will not be told" — that is the whole contract.
    expect(value).toContain('notified');
  });

  it('states the hour tracking stops, and what stopping costs', () => {
    const value = valueOf({ ...SETTINGS, autoStartEnabled: true }, 'schedule');

    expect(value).toContain('9:00 AM');
    expect(value).toContain('6:00 PM');
    expect(value).toContain('not logged');
  });

  it('says the employee is in charge when no schedule is set', () => {
    expect(valueOf(SETTINGS, 'schedule')).toContain('when you say so');
  });
});

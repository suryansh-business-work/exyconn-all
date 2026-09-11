import { describe, expect, it } from 'vitest';
import type { TrackerSettings } from '../../src/types';
import { autoStopNotice } from '../../src/auto-stop';

/** A workspace on a 9-to-18 schedule. Only the schedule fields matter here. */
const SETTINGS: TrackerSettings = {
  intervalMinutes: 10,
  screenshotsPerInterval: 1,
  randomizeScreenshotTiming: true,
  blurScreenshots: false,
  trackWindowTitles: true,
  idleThresholdSeconds: 300,
  idleAutoPauseMinutes: 0,
  screenshotMaxWidth: 1600,
  screenshotQuality: 70,
  captureSoundEnabled: true,
  webcamEnabled: false,
  webcamCorner: 'bottom-right',
  syncIntervalMinutes: 5,
  autoStartEnabled: true,
  autoStartHour: 9,
  autoStopHour: 18,
  consentText: '<p>ok</p>',
};

const ZONE = 'Asia/Kolkata';

/** An instant that reads as `hh:mm` on a Kolkata clock (UTC+05:30, no DST). */
function kolkata(hour: number, minute = 0): Date {
  return new Date(Date.UTC(2026, 8, 8, hour - 5, minute - 30));
}

describe('autoStopNotice', () => {
  it('says nothing at all when the workspace runs no schedule', () => {
    const notice = autoStopNotice(
      { ...SETTINGS, autoStartEnabled: false },
      ZONE,
      'tracking',
      kolkata(11),
    );

    expect(notice).toBeNull();
  });

  it('says nothing before the portal has answered', () => {
    expect(autoStopNotice(null, ZONE, 'idle', kolkata(11))).toBeNull();
  });

  it('states the stop time while the day is still young', () => {
    const notice = autoStopNotice(SETTINGS, ZONE, 'tracking', kolkata(11));

    expect(notice?.severity).toBe('info');
    expect(notice?.title).toContain('9:00 AM');
    expect(notice?.title).toContain('6:00 PM');
    // Seven hours to go, said as hours rather than as 420 minutes.
    expect(notice?.detail).toContain('7h 00m');
  });

  it('warns as the window is about to shut on a running session', () => {
    const notice = autoStopNotice(SETTINGS, ZONE, 'tracking', kolkata(17, 52));

    expect(notice?.severity).toBe('warning');
    expect(notice?.title).toBe('Tracking stops in 8 minutes');
    expect(notice?.detail).toContain('not logged');
  });

  it('warns a paused session too — it is just as stopped at six', () => {
    expect(autoStopNotice(SETTINGS, ZONE, 'paused', kolkata(17, 52))?.severity).toBe('warning');
  });

  it('does not count down at an idle tracker that has nothing to lose yet', () => {
    const notice = autoStopNotice(SETTINGS, ZONE, 'idle', kolkata(17, 52));

    expect(notice?.severity).toBe('info');
  });

  it('warns that a session started outside the window will be stopped again', () => {
    const notice = autoStopNotice(SETTINGS, ZONE, 'idle', kolkata(20));

    expect(notice?.severity).toBe('warning');
    expect(notice?.title).toContain('Outside your tracking hours');
    expect(notice?.detail).toContain('off-computer time');
  });

  it('reads the clock in the EMPLOYEE’s zone, not this machine’s', () => {
    // 20:00 in Kolkata is 14:30 UTC — mid-window for a workspace reading UTC, and shut for one
    // reading Kolkata. The employee's zone is the one that decides.
    const at = kolkata(20);

    expect(autoStopNotice(SETTINGS, ZONE, 'idle', at)?.severity).toBe('warning');
    expect(autoStopNotice(SETTINGS, 'UTC', 'idle', at)?.severity).toBe('info');
  });

  it('counts a night shift’s stop hour as tomorrow’s, not a negative countdown', () => {
    // 22:00 → 06:00 crosses midnight; at 23:00 the stop is seven hours away.
    const nightShift = { ...SETTINGS, autoStartHour: 22, autoStopHour: 6 };

    const notice = autoStopNotice(nightShift, ZONE, 'tracking', kolkata(23));

    expect(notice?.severity).toBe('info');
    expect(notice?.detail).toContain('7h 00m');
  });
});

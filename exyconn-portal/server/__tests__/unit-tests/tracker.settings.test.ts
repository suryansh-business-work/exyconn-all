import { TrackerSettingsModel } from '../../src/modules/tracker/models';
import {
  getTrackerSettings,
  updateTrackerSettings,
} from '../../src/modules/tracker/tracker.settings.service';
import { TRACKER_DEFAULTS } from '../../src/modules/tracker/tracker.constants';

describe('tracker settings', () => {
  it('creates the global document with defaults on first read', async () => {
    const settings = await getTrackerSettings();
    expect(settings.syncIntervalMinutes).toBe(TRACKER_DEFAULTS.syncIntervalMinutes);
    expect(settings.screenshotQuality).toBe(TRACKER_DEFAULTS.screenshotQuality);
  });

  it('fills in fields the stored document predates', async () => {
    // A document written before syncIntervalMinutes/defaultTimezone existed. Inserted via the raw
    // collection so Mongoose schema defaults are bypassed — exactly how the live document
    // looked, and why the non-nullable GraphQL field previously blew up with "Cannot return
    // null". Every new non-nullable setting must survive this test.
    await TrackerSettingsModel.collection.insertOne({
      key: 'global',
      intervalMinutes: 10,
      screenshotsPerInterval: 1,
      randomizeScreenshotTiming: true,
      blurScreenshots: false,
      trackWindowTitles: true,
      idleThresholdSeconds: 300,
      screenshotMaxWidth: 1280,
      screenshotQuality: 60,
    });

    const settings = await getTrackerSettings();

    expect(settings.syncIntervalMinutes).toBe(TRACKER_DEFAULTS.syncIntervalMinutes);
    expect(settings.defaultTimezone).toBe(TRACKER_DEFAULTS.defaultTimezone);
    expect(settings.webcamEnabled).toBe(TRACKER_DEFAULTS.webcamEnabled);
    // The stored values must still win over the defaults.
    expect(settings.intervalMinutes).toBe(10);
  });

  it('never lets a default overwrite a stored falsy value', async () => {
    await updateTrackerSettings({ blurScreenshots: false, screenshotsPerInterval: 0 });

    const settings = await getTrackerSettings();

    expect(settings.blurScreenshots).toBe(false);
    expect(settings.screenshotsPerInterval).toBe(0);
  });

  it('round-trips a sync-interval update', async () => {
    await updateTrackerSettings({ syncIntervalMinutes: 15 });
    await expect(getTrackerSettings()).resolves.toMatchObject({ syncIntervalMinutes: 15 });
  });

  it('round-trips the house default timezone', async () => {
    await updateTrackerSettings({ defaultTimezone: 'Asia/Kolkata' });
    await expect(getTrackerSettings()).resolves.toMatchObject({ defaultTimezone: 'Asia/Kolkata' });
  });

  it('accepts an empty default timezone — it means "use the device\'s own zone"', async () => {
    await updateTrackerSettings({ defaultTimezone: '' });
    await expect(getTrackerSettings()).resolves.toMatchObject({ defaultTimezone: '' });
  });

  it('rejects a default timezone that is not a real zone', async () => {
    // A typo here would silently misdate every employee's hours, so it never reaches the DB.
    await expect(updateTrackerSettings({ defaultTimezone: 'Not/AZone' })).rejects.toThrow(
      /Unknown timezone/i,
    );
    await expect(getTrackerSettings()).resolves.toMatchObject({ defaultTimezone: '' });
  });

  it('defaults webcam capture to off', async () => {
    // Photographing an employee is opt-in by an administrator, never a default.
    await expect(getTrackerSettings()).resolves.toMatchObject({
      webcamEnabled: false,
      webcamCorner: 'bottom-right',
    });
  });

  it('round-trips webcam capture and the corner it goes in', async () => {
    await updateTrackerSettings({ webcamEnabled: true, webcamCorner: 'top-left' });
    await expect(getTrackerSettings()).resolves.toMatchObject({
      webcamEnabled: true,
      webcamCorner: 'top-left',
    });
  });

  it('rejects a corner the desktop app cannot place a photo in', async () => {
    await expect(updateTrackerSettings({ webcamCorner: 'middle' })).rejects.toThrow(
      /Unknown webcam corner/i,
    );
    await expect(getTrackerSettings()).resolves.toMatchObject({ webcamCorner: 'bottom-right' });
  });

  it('accepts the whole 0-100 quality range, so 100 can mean lossless', async () => {
    await updateTrackerSettings({ screenshotQuality: 100 });
    await expect(getTrackerSettings()).resolves.toMatchObject({ screenshotQuality: 100 });

    await updateTrackerSettings({ screenshotQuality: 0 });
    await expect(getTrackerSettings()).resolves.toMatchObject({ screenshotQuality: 0 });
  });
});

import { TrackerSettingsModel } from '../../src/modules/tracker/models';
import {
  getTrackerSettings,
  updateTrackerSettings,
} from '../../src/modules/tracker/tracker.settings.service';
import { TRACKER_DEFAULTS } from '../../src/modules/tracker/tracker.constants';

describe('tracker settings', () => {
  it('creates the global document with defaults on first read', async () => {
    const settings = await getTrackerSettings();
    expect(settings.autoSyncEnabled).toBe(TRACKER_DEFAULTS.autoSyncEnabled);
    expect(settings.syncIntervalMinutes).toBe(TRACKER_DEFAULTS.syncIntervalMinutes);
  });

  it('fills in fields the stored document predates', async () => {
    // A document written before autoSync* existed. Inserted through the raw collection so
    // Mongoose schema defaults are bypassed — exactly how the live document looked, and why
    // the non-nullable GraphQL field previously blew up with "Cannot return null".
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

    expect(settings.autoSyncEnabled).toBe(TRACKER_DEFAULTS.autoSyncEnabled);
    expect(settings.syncIntervalMinutes).toBe(TRACKER_DEFAULTS.syncIntervalMinutes);
    // The stored values must still win over the defaults.
    expect(settings.intervalMinutes).toBe(10);
  });

  it('never lets a default overwrite a stored falsy value', async () => {
    await updateTrackerSettings({ autoSyncEnabled: false, screenshotsPerInterval: 0 });

    const settings = await getTrackerSettings();

    expect(settings.autoSyncEnabled).toBe(false);
    expect(settings.screenshotsPerInterval).toBe(0);
  });

  it('round-trips a sync-interval update', async () => {
    await updateTrackerSettings({ syncIntervalMinutes: 15 });
    await expect(getTrackerSettings()).resolves.toMatchObject({ syncIntervalMinutes: 15 });
  });
});

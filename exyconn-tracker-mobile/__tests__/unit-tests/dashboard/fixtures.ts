import type { LiveStats, TrackerSettings } from '@exyconn/tracker-core';
import type { Capabilities } from '../../../src/tracker/types';

export const ANDROID: Capabilities = {
  screenshots: true,
  foregroundApp: true,
  inputCounts: false,
  webcam: true,
  background: true,
};

export const IOS: Capabilities = {
  screenshots: false,
  foregroundApp: false,
  inputCounts: false,
  webcam: false,
  background: false,
};

export function stats(overrides: Partial<LiveStats> = {}): LiveStats {
  return {
    status: 'tracking',
    sessionActiveMs: 45 * 60_000,
    sessionIdleMs: 15 * 60_000,
    keyCount: 0,
    mouseCount: 0,
    currentApp: 'Slack',
    screenshotCount: 3,
    pendingSync: 0,
    lastSyncAt: null,
    syncing: false,
    dayActiveMs: 0,
    lastSyncOutcome: null,
    ...overrides,
  };
}

export function settings(overrides: Partial<TrackerSettings> = {}): TrackerSettings {
  return {
    intervalMinutes: 10,
    screenshotsPerInterval: 2,
    randomizeScreenshotTiming: true,
    blurScreenshots: false,
    trackWindowTitles: true,
    idleThresholdSeconds: 300,
    idleAutoPauseMinutes: 0,
    screenshotMaxWidth: 1920,
    screenshotQuality: 80,
    captureSoundEnabled: true,
    webcamEnabled: true,
    webcamCorner: 'bottom-right',
    autoStartEnabled: false,
    autoStartHour: 9,
    autoStopHour: 18,
    syncIntervalMinutes: 5,
    consentText: '',
    ...overrides,
  };
}

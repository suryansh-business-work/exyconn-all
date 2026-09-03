import { describe, it, expect } from 'vitest';
import type { TrackerSettings } from '@shared/types';
import { blurWidth, capturePolicy, JPEG_MIME, PNG_MIME } from './capture-policy';

const SETTINGS: TrackerSettings = {
  intervalMinutes: 10,
  screenshotsPerInterval: 1,
  randomizeScreenshotTiming: true,
  blurScreenshots: false,
  trackWindowTitles: true,
  idleThresholdSeconds: 300,
  screenshotMaxWidth: 1280,
  screenshotQuality: 60,
  webcamEnabled: false,
  webcamCorner: 'bottom-right',
  autoSyncEnabled: true,
  syncIntervalMinutes: 5,
  consentText: '<p>ok</p>',
};

const at = (screenshotQuality: number): TrackerSettings => ({ ...SETTINGS, screenshotQuality });

describe('capturePolicy', () => {
  it('keeps the native resolution and encodes losslessly at 100', () => {
    // The whole point of the top of the dial: "100%" must not quietly mean "1280px JPEG".
    expect(capturePolicy(at(100), 3840)).toEqual({
      targetWidth: null,
      lossless: true,
      mimeType: PNG_MIME,
    });
  });

  it('downscales and encodes JPEG below 100', () => {
    expect(capturePolicy(at(99), 3840)).toEqual({
      targetWidth: 1280,
      lossless: false,
      mimeType: JPEG_MIME,
    });
  });

  it('never upscales a screen narrower than the max width', () => {
    expect(capturePolicy(at(60), 1024).targetWidth).toBe(1024);
  });

  it('accepts the bottom of the dial', () => {
    expect(capturePolicy(at(0), 1920)).toMatchObject({ lossless: false, mimeType: JPEG_MIME });
  });
});

describe('blurWidth', () => {
  it('shrinks hard enough that text cannot survive', () => {
    expect(blurWidth(1280)).toBe(107);
  });

  it('keeps a floor, so a tiny screen does not blur to nothing', () => {
    expect(blurWidth(120)).toBe(64);
  });
});

import { describe, expect, it } from 'vitest';
import {
  announceCapture,
  captureText,
  captureUrl,
  composeWithWebcam,
} from '../../../src/tracker/capture';
import { stats } from '../dashboard/fixtures';
import { captureReport } from './capture-fixtures';

describe('captureUrl', () => {
  it('deep-links to the capture’s day in the gallery, encoding the instant', () => {
    expect(captureUrl('2026-09-11T10:15:00.000Z')).toBe(
      'exyconntracker://screenshots?capturedAt=2026-09-11T10%3A15%3A00.000Z',
    );
  });
});

describe('captureText', () => {
  it('names one screenshot, the session so far, the app in front and the tap hint', () => {
    expect(captureText(captureReport())).toEqual({
      title: 'Exyconn Tracker — Screenshot captured',
      body: 'Worked 45m · 75% active\nIn Slack\nTap to open it',
    });
  });

  it('counts a burst of several screenshots', () => {
    const report = captureReport({ capture: { count: 3, capturedAt: '2026-09-11T10:15:00Z' } });
    expect(captureText(report).title).toBe('Exyconn Tracker — 3 screenshots captured');
  });

  it('leaves out the app line when nothing is known to be in front', () => {
    const report = captureReport({ stats: stats({ currentApp: '', sessionIdleMs: 0 }) });
    expect(captureText(report).body).toBe('Worked 45m · 100% active\nTap to open it');
  });
});

/** iOS: no native module, so there is no capture to announce or camera to use. */
describe('without the native module', () => {
  it('announces nothing', () => {
    expect(() => announceCapture(captureReport(), null, false)).not.toThrow();
  });

  it('adds no webcam photo', async () => {
    await expect(
      composeWithWebcam({
        screen: 'base64',
        mimeType: 'image/jpeg',
        corner: 'top-left',
        quality: 80,
      }),
    ).resolves.toBeNull();
  });
});

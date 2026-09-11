import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TrackerEngine, type EngineDeps, type EngineHooks } from '../../src/engine';
import { Outbox } from '../../src/outbox';
import type { TrackerSettings } from '../../src/types';

const SETTINGS: TrackerSettings = {
  intervalMinutes: 10,
  screenshotsPerInterval: 0,
  randomizeScreenshotTiming: false,
  blurScreenshots: false,
  trackWindowTitles: true,
  idleThresholdSeconds: 60,
  idleAutoPauseMinutes: 0,
  screenshotMaxWidth: 1280,
  screenshotQuality: 80,
  captureSoundEnabled: true,
  webcamEnabled: false,
  webcamCorner: 'bottom-right',
  syncIntervalMinutes: 5,
  consentText: '',
  autoStartEnabled: false,
  autoStartHour: 9,
  autoStopHour: 18,
};

const hooks: EngineHooks = {
  onStats: () => undefined,
  onCapture: () => undefined,
  onAuthError: () => undefined,
  onAutoPaused: () => undefined,
  composeWithWebcam: () => Promise.resolve(null),
};

function deps(order: string[], startSession: () => Promise<string>): EngineDeps {
  let saved: string | null = null;
  return {
    portal: {
      startSession: vi.fn(() => {
        order.push('portal:start');
        return startSession();
      }),
      stopSession: vi.fn(() => {
        order.push('portal:stop');
        return Promise.resolve();
      }),
      syncIntervals: vi.fn(() => Promise.resolve()),
      uploadScreenshot: vi.fn(() => Promise.resolve()),
    },
    outbox: new Outbox(
      { read: () => saved, write: (contents) => (saved = contents) },
      { put: () => undefined, get: () => null, remove: () => undefined },
    ),
    idleSeconds: () => 0,
    input: {
      start: () => undefined,
      stop: () => undefined,
      peek: () => ({ keys: 0, clicks: 0 }),
      drain: () => ({ keys: 0, clicks: 0 }),
    },
    foreground: { sample: () => Promise.resolve('Maps'), drain: () => [] },
    capture: () => Promise.resolve([]),
    session: {
      begin: () => {
        order.push('session:begin');
        return Promise.resolve();
      },
      end: () => {
        order.push('session:end');
        return Promise.resolve();
      },
    },
  };
}

describe('TrackerEngine platform session', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens the platform session before the portal one, and closes it after', async () => {
    const order: string[] = [];
    const engine = new TrackerEngine(
      SETTINGS,
      hooks,
      deps(order, () => Promise.resolve('s1')),
    );

    await engine.start('p1');
    await vi.advanceTimersByTimeAsync(2000);
    await engine.stop();

    expect(order).toEqual(['session:begin', 'portal:start', 'portal:stop', 'session:end']);
  });

  it('never opens a portal session when the platform refuses (capture declined)', async () => {
    const order: string[] = [];
    const refusing = deps(order, () => Promise.resolve('s1'));
    refusing.session = {
      begin: () => Promise.reject(new Error('Screen capture was declined.')),
      end: () => Promise.resolve(),
    };
    const engine = new TrackerEngine(SETTINGS, hooks, refusing);

    await expect(engine.start('p1')).rejects.toThrow('declined');
    expect(order).toEqual([]);
    expect(engine.currentStatus).toBe('idle');
  });

  it('releases the platform session when the portal refuses to open one', async () => {
    const order: string[] = [];
    const engine = new TrackerEngine(
      SETTINGS,
      hooks,
      deps(order, () => Promise.reject(new Error('Mark your attendance first'))),
    );

    await expect(engine.start('p1')).rejects.toThrow('attendance');
    expect(order).toEqual(['session:begin', 'portal:start', 'session:end']);
    expect(engine.currentStatus).toBe('idle');
  });
});

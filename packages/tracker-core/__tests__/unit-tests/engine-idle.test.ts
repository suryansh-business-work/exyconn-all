import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LiveStats } from '../../src/types';
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

/** Idle seconds the platform reports on the next tick. */
let idleFor = 0;
let last: LiveStats | null = null;

async function trackingEngine(): Promise<TrackerEngine> {
  const platform = { ...deps([], () => Promise.resolve('s1')), idleSeconds: () => idleFor };
  const engine = new TrackerEngine(
    SETTINGS,
    { ...hooks, onStats: (stats) => (last = stats) },
    platform,
  );
  await engine.start('p1');
  return engine;
}

/** Runs `seconds` ticks, the platform reporting an idle run growing from `from`. */
async function idleFrom(from: number, seconds: number): Promise<void> {
  for (let second = 0; second < seconds; second += 1) {
    idleFor = from + second;
    await vi.advanceTimersByTimeAsync(1000);
  }
}

async function active(seconds: number): Promise<void> {
  idleFor = 0;
  await vi.advanceTimersByTimeAsync(seconds * 1000);
}

describe('TrackerEngine idle time', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    idleFor = 0;
    last = null;
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts a break shorter than the threshold as worked', async () => {
    await trackingEngine();
    await active(30);
    await idleFrom(1, 40); // threshold is 60s
    await active(10);

    expect(last?.sessionIdleMs).toBe(0);
    expect(last?.sessionActiveMs).toBe(80_000);
  });

  it('counts the whole of a longer break as idle, including its first minute', async () => {
    await trackingEngine();
    await active(30);
    await idleFrom(1, 90);
    await active(10);

    expect(last?.sessionIdleMs).toBe(90_000);
    expect(last?.sessionActiveMs).toBe(40_000);
  });

  it('never moves more than the current bucket holds', async () => {
    await trackingEngine();
    // The run is already long when tracking starts: only 5 active seconds exist to move.
    await active(5);
    await idleFrom(200, 3);

    expect(last?.sessionActiveMs).toBe(0);
    expect(last?.sessionIdleMs).toBe(8_000);
  });
});

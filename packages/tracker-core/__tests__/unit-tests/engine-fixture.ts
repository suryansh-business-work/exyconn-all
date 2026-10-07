import { vi } from 'vitest';
import type { EngineDeps, EngineHooks, ScreenCapture } from '../../src/engine';
import { Outbox } from '../../src/outbox';
import type { LiveStats, TrackerSettings, WindowUsage } from '../../src/types';

/** A workspace with no screenshots, no auto-pause and a 10-minute interval. */
export const ENGINE_SETTINGS: TrackerSettings = {
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

/** The fakes behind one engine, kept so a test can steer them and read what they saw. */
export interface EnginePlatform {
  deps: EngineDeps;
  hooks: EngineHooks;
  /** Every stats snapshot the engine pushed, newest last. */
  stats: LiveStats[];
  /** What the platform reports as idle seconds on the next tick. */
  idle: { seconds: number };
  /** Input counted since the last drain. */
  input: { keys: number; clicks: number };
  /** Images held beside the queue, by key. */
  images: Map<string, string>;
  /** When set, saving the queue throws — a full disk. */
  storage: { failWrites: boolean };
  /** What the next capture returns; push to it. */
  captures: ScreenCapture[];
  /** What the foreground sampler hands back on drain; push to it. */
  windows: WindowUsage[];
  /** Last stats pushed, or the empty-handed fallback before any push. */
  latest(): LiveStats;
}

/** A platform whose every piece is a hand-written fake; override any part per test. */
export function enginePlatform(overrides: Partial<EngineDeps> = {}): EnginePlatform {
  let saved: string | null = null;
  const images = new Map<string, string>();
  const stats: LiveStats[] = [];
  const idle = { seconds: 0 };
  const input = { keys: 0, clicks: 0 };
  const storage = { failWrites: false };
  const captures: ScreenCapture[] = [];
  const windows: WindowUsage[] = [];
  const deps: EngineDeps = {
    portal: {
      startSession: vi.fn(() => Promise.resolve('session-1')),
      stopSession: vi.fn(() => Promise.resolve()),
      syncIntervals: vi.fn(() => Promise.resolve()),
      uploadScreenshot: vi.fn(() => Promise.resolve()),
    },
    outbox: new Outbox(
      {
        read: () => saved,
        write: (contents) => {
          if (storage.failWrites) {
            throw new Error('Disk full');
          }
          saved = contents;
        },
      },
      {
        put: (key, image) => images.set(key, image),
        get: (key) => images.get(key) ?? null,
        remove: (key) => images.delete(key),
      },
    ),
    idleSeconds: () => idle.seconds,
    input: {
      start: vi.fn(),
      stop: vi.fn(),
      peek: () => ({ ...input }),
      drain: () => {
        const counted = { ...input };
        input.keys = 0;
        input.clicks = 0;
        return counted;
      },
    },
    foreground: {
      sample: vi.fn(() => Promise.resolve('Editor')),
      drain: vi.fn(() => windows),
    },
    capture: vi.fn(() => Promise.resolve(captures)),
    ...overrides,
  };
  return {
    deps,
    stats,
    idle,
    input,
    images,
    storage,
    captures,
    windows,
    hooks: {
      onStats: vi.fn((next: LiveStats) => {
        stats.push(next);
      }),
      onCapture: vi.fn(),
      onAuthError: vi.fn(),
      onAutoPaused: vi.fn(),
      composeWithWebcam: vi.fn(() => Promise.resolve(null)),
    },
    latest: () => {
      const last = stats.at(-1);
      if (last === undefined) {
        throw new Error('The engine has not pushed any stats yet');
      }
      return last;
    },
  };
}

/** One display's capture, as a platform capturer hands it over. */
export function screen(displayId: string, image = `image-${displayId}`): ScreenCapture {
  return { image, mimeType: 'image/jpeg', displayId, blurred: false };
}

/** An interval payload to seed the queue with, independent of any running session. */
export function queuedInterval(at: string): Parameters<Outbox['enqueueInterval']>[1] {
  return {
    startedAt: at,
    endedAt: at,
    keyCount: 0,
    mouseCount: 0,
    activeMs: 1000,
    idleMs: 0,
    windows: [],
  };
}

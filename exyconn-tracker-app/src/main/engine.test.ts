import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { LiveStats, TrackerSettings } from '@shared/types';

const tempDir = mkdtempSync(join(tmpdir(), 'engine-'));

vi.mock('electron', () => ({
  app: { getPath: () => tempDir },
  // Always "active" — idle accounting is not what these tests are about.
  powerMonitor: { getSystemIdleTime: () => 0 },
}));

// The native input hook and screen capture cannot run in a test process.
vi.mock('./trackers/input-counter', () => ({
  InputCounter: class {
    start(): void {}
    stop(): void {}
    peek(): { keys: number; clicks: number } {
      return { keys: 0, clicks: 0 };
    }
    drain(): { keys: number; clicks: number } {
      return { keys: 7, clicks: 3 };
    }
  },
}));
vi.mock('./trackers/window-tracker', () => ({
  WindowTracker: class {
    sample(): Promise<string> {
      return Promise.resolve('Code');
    }
    drain(): unknown[] {
      return [];
    }
  },
}));
/** What the fake screenshotter hands back. Empty unless a test asks for a capture. */
const captures: unknown[] = [];
vi.mock('./trackers/screenshotter', () => ({
  Screenshotter: class {
    capture(): Promise<unknown[]> {
      return Promise.resolve(captures);
    }
  },
}));
vi.mock('./notifier', () => ({ notifyScreenshotCaptured: () => undefined }));

vi.mock('./portal-client', async () => {
  const actual = await vi.importActual<typeof import('./portal-client')>('./portal-client');
  return {
    ...actual,
    startSession: vi.fn(() => Promise.resolve('session-1')),
    stopSession: vi.fn(() => Promise.resolve()),
    syncIntervals: vi.fn(() => Promise.resolve()),
    uploadScreenshot: vi.fn(() => Promise.resolve()),
  };
});

import { TrackerEngine } from './engine';
import * as portal from './portal-client';

const OUTBOX_FILE = join(tempDir, 'tracker-outbox.json');

const SETTINGS: TrackerSettings = {
  intervalMinutes: 10,
  screenshotsPerInterval: 1,
  randomizeScreenshotTiming: true,
  blurScreenshots: false,
  trackWindowTitles: true,
  idleThresholdSeconds: 300,
  screenshotMaxWidth: 1600,
  screenshotQuality: 70,
  webcamEnabled: false,
  webcamCorner: 'bottom-right',
  syncIntervalMinutes: 5,
  consentText: '<p>ok</p>',
};

interface Built {
  engine: TrackerEngine;
  stats: () => LiveStats | null;
  compose: ReturnType<typeof vi.fn>;
}

function build(settings: TrackerSettings = SETTINGS, composed: string | null = null): Built {
  let latest: LiveStats | null = null;
  const compose = vi.fn(() => Promise.resolve(composed));
  const engine = new TrackerEngine(settings, {
    onStats: (s) => {
      latest = s;
    },
    onCapture: () => undefined,
    onAuthError: () => undefined,
    composeWithWebcam: compose,
  });
  return { engine, stats: () => latest, compose };
}

/** One capture on the wire, as the screenshotter would produce it. */
const SHOT = {
  image: 'screen-bytes',
  mimeType: 'image/jpeg',
  displayId: '1',
  blurred: false,
};

/** Runs a session long enough for the (non-randomised) screenshot to fire. */
async function captureOnce(built: Built): Promise<void> {
  vi.useFakeTimers();
  await built.engine.start();
  // Long enough for the (non-randomised) screenshot to fire and for the auto-sync that
  // follows it to drain the outbox, so the assertion reads what the portal was actually sent.
  await vi.advanceTimersByTimeAsync(5_000);
  vi.useRealTimers();
}

/** The image that actually reached the portal — what the manager will end up looking at. */
function uploadedImage(): string | undefined {
  const [input] = vi.mocked(portal.uploadScreenshot).mock.calls[0] ?? [];
  return input?.image;
}

describe('TrackerEngine sync', () => {
  beforeEach(() => {
    rmSync(OUTBOX_FILE, { force: true });
    vi.clearAllMocks();
  });

  it('says "nothing to upload" instead of doing nothing silently', async () => {
    const { engine } = build();

    const outcome = await engine.syncNow();

    // The old code returned void here: no upload, no timestamp, no message. That silence is
    // exactly what made the button look broken.
    expect(outcome.kind).toBe('nothing');
  });

  it('records the time of a sync that had nothing to upload', async () => {
    const { engine, stats } = build();

    await engine.syncNow();

    // "Everything uploaded · Last synced Never" was the bug: lastSyncAt only moved when
    // something was actually sent.
    expect(stats()?.lastSyncAt).not.toBeNull();
  });

  it('uploads the in-progress interval instead of waiting for the interval timer', async () => {
    vi.useFakeTimers();
    const { engine } = build();
    await engine.start();

    // Two minutes of tracking — far short of the 10-minute interval that would flush it.
    await vi.advanceTimersByTimeAsync(120_000);
    const outcome = await engine.syncNow();
    vi.useRealTimers();

    // The bucket lived in memory, so the queue was empty and "Sync now" uploaded nothing.
    expect(portal.syncIntervals).toHaveBeenCalledTimes(1);
    expect(outcome).toEqual({ kind: 'uploaded', count: 1, discarded: 0 });
  });

  it('does not let a manual sync postpone the employee’s screenshot', async () => {
    vi.useFakeTimers();
    const { engine } = build();
    await engine.start();
    await vi.advanceTimersByTimeAsync(60_000);

    const before = Reflect.get(engine, 'nextScreenshotAt') as number | null;
    await engine.syncNow();
    const after = Reflect.get(engine, 'nextScreenshotAt') as number | null;
    vi.useRealTimers();

    // Closing the interval must NOT re-roll the screenshot schedule, or anyone could dodge
    // being screenshotted forever by pressing "Sync now" on a loop.
    expect(after).toBe(before);
  });

  it('reports an unreachable portal in plain English and keeps the work queued', async () => {
    vi.useFakeTimers();
    vi.mocked(portal.syncIntervals).mockRejectedValueOnce(new TypeError('fetch failed'));
    const { engine, stats } = build();
    await engine.start();
    await vi.advanceTimersByTimeAsync(120_000);

    const outcome = await engine.syncNow();
    vi.useRealTimers();

    expect(outcome.kind).toBe('failed');
    expect(outcome).toHaveProperty('reason', expect.stringContaining('Cannot reach the portal'));
    // The employee's work is still on disk, not lost.
    expect(stats()?.pendingSync).toBe(1);
  });
});

describe('TrackerEngine webcam capture', () => {
  beforeEach(() => {
    rmSync(OUTBOX_FILE, { force: true });
    vi.clearAllMocks();
    captures.length = 0;
    captures.push({ ...SHOT });
  });

  afterEach(() => {
    captures.length = 0;
  });

  it('does not reach for the camera when the workspace has not asked for a photo', async () => {
    const built = build({ ...SETTINGS, randomizeScreenshotTiming: false });

    await captureOnce(built);

    expect(built.compose).not.toHaveBeenCalled();
    expect(uploadedImage()).toBe('screen-bytes');
  });

  it('queues the composited image when webcam capture is on', async () => {
    const built = build(
      { ...SETTINGS, randomizeScreenshotTiming: false, webcamEnabled: true },
      'screen-plus-face',
    );

    await captureOnce(built);

    expect(built.compose).toHaveBeenCalledWith({
      screen: 'screen-bytes',
      mimeType: 'image/jpeg',
      corner: 'bottom-right',
      quality: SETTINGS.screenshotQuality,
    });
    expect(uploadedImage()).toBe('screen-plus-face');
  });

  it('still records the screenshot when no photo could be taken', async () => {
    // No camera, a denied permission, a renderer that never answered: the employee must not
    // lose the screenshot — and the tracked time it belongs to — over a missing photo.
    const built = build({ ...SETTINGS, randomizeScreenshotTiming: false, webcamEnabled: true });

    await captureOnce(built);

    expect(built.compose).toHaveBeenCalled();
    expect(uploadedImage()).toBe('screen-bytes');
  });
});

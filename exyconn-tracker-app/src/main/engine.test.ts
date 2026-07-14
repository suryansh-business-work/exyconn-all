import { describe, it, expect, beforeEach, vi } from 'vitest';
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
vi.mock('./trackers/screenshotter', () => ({
  Screenshotter: class {
    capture(): Promise<unknown[]> {
      return Promise.resolve([]);
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
  autoSyncEnabled: true,
  syncIntervalMinutes: 5,
  consentText: '<p>ok</p>',
};

function build(): { engine: TrackerEngine; stats: () => LiveStats | null } {
  let latest: LiveStats | null = null;
  const engine = new TrackerEngine(SETTINGS, {
    onStats: (s) => {
      latest = s;
    },
    onAuthError: () => undefined,
  });
  return { engine, stats: () => latest };
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

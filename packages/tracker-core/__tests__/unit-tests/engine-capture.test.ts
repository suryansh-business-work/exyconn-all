import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TrackerEngine } from '../../src/engine';
import type { TrackerSettings } from '../../src/types';
import { ENGINE_SETTINGS, enginePlatform, screen, type EnginePlatform } from './engine-fixture';

const ONE_SHOT: TrackerSettings = { ...ENGINE_SETTINGS, screenshotsPerInterval: 1 };

/** The images the portal received, in upload order — the first tick's auto-sync sends them. */
function uploaded(platform: EnginePlatform): string[] {
  return vi.mocked(platform.deps.portal.uploadScreenshot).mock.calls.map(([shot]) => shot.image);
}

async function tracking(platform: EnginePlatform, settings: TrackerSettings) {
  const engine = new TrackerEngine(settings, platform.hooks, platform.deps);
  await engine.start('project-1');
  return engine;
}

describe('TrackerEngine screenshots', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-03T09:00:00.000Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('captures every display a second in, queues each, and reports the burst once', async () => {
    const platform = enginePlatform();
    platform.captures.push(screen('d1'), screen('d2'));
    const engine = await tracking(platform, ONE_SHOT);

    await vi.advanceTimersByTimeAsync(1000);

    expect(uploaded(platform)).toEqual(['image-d1', 'image-d2']);
    expect(platform.hooks.onCapture).toHaveBeenCalledTimes(1);
    expect(platform.hooks.onCapture).toHaveBeenCalledWith(
      expect.objectContaining({
        capture: { count: 2, capturedAt: '2026-02-03T09:00:01.000Z' },
        preview: 'image-d1',
        previewMimeType: 'image/jpeg',
        stats: expect.objectContaining({ screenshotCount: 2 }),
      }),
    );
    // One schedule per interval: the next second takes nothing.
    await vi.advanceTimersByTimeAsync(1000);
    expect(platform.deps.capture).toHaveBeenCalledTimes(1);
    await engine.stop();
  });

  it('announces nothing when the platform took no shot', async () => {
    const platform = enginePlatform();
    const engine = await tracking(platform, ONE_SHOT);

    await vi.advanceTimersByTimeAsync(1000);

    expect(platform.deps.capture).toHaveBeenCalledTimes(1);
    expect(platform.hooks.onCapture).not.toHaveBeenCalled();
    await engine.stop();
  });

  it('never captures when the workspace asks for no screenshots', async () => {
    const platform = enginePlatform();
    const engine = await tracking(platform, ENGINE_SETTINGS);

    await vi.advanceTimersByTimeAsync(5000);

    expect(platform.deps.capture).not.toHaveBeenCalled();
    await engine.stop();
  });

  it('fires a randomised shot at the drawn point in the interval', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const platform = enginePlatform();
    platform.captures.push(screen('d1'));
    const engine = await tracking(platform, {
      ...ONE_SHOT,
      intervalMinutes: 1,
      randomizeScreenshotTiming: true,
    });

    await vi.advanceTimersByTimeAsync(29_000);
    expect(platform.deps.capture).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1000);
    expect(platform.deps.capture).toHaveBeenCalledTimes(1);
    await engine.stop();
  });

  it('uploads the webcam composite when one could be made', async () => {
    const platform = enginePlatform();
    vi.mocked(platform.hooks.composeWithWebcam).mockResolvedValue('composited');
    platform.captures.push(screen('d1'));
    const engine = await tracking(platform, { ...ONE_SHOT, webcamEnabled: true });

    await vi.advanceTimersByTimeAsync(1000);

    expect(platform.hooks.composeWithWebcam).toHaveBeenCalledWith({
      screen: 'image-d1',
      mimeType: 'image/jpeg',
      corner: 'bottom-right',
      quality: 80,
    });
    expect(uploaded(platform)).toEqual(['composited']);
    await engine.stop();
  });

  it('keeps the plain screenshot when no webcam photo could be taken', async () => {
    const platform = enginePlatform();
    platform.captures.push(screen('d1'));
    const engine = await tracking(platform, { ...ONE_SHOT, webcamEnabled: true });

    await vi.advanceTimersByTimeAsync(1000);

    expect(platform.hooks.composeWithWebcam).toHaveBeenCalledTimes(1);
    expect(uploaded(platform)).toEqual(['image-d1']);
    await engine.stop();
  });

  it('closes the interval when it is full, with the window usage it saw', async () => {
    const platform = enginePlatform();
    platform.windows.push({ appName: 'Editor', windowTitle: 'a.ts', durationMs: 60_000 });
    const engine = await tracking(platform, {
      ...ENGINE_SETTINGS,
      intervalMinutes: 1,
      trackWindowTitles: false,
      syncIntervalMinutes: 60,
    });

    await vi.advanceTimersByTimeAsync(60_000);

    expect(platform.deps.foreground.drain).toHaveBeenCalledWith(
      new Date('2026-02-03T09:01:00.000Z').getTime(),
      false,
    );
    expect(platform.deps.portal.syncIntervals).toHaveBeenCalledWith('session-1', [
      {
        startedAt: '2026-02-03T09:00:00.000Z',
        endedAt: '2026-02-03T09:01:00.000Z',
        keyCount: 0,
        mouseCount: 0,
        activeMs: 60_000,
        idleMs: 0,
        windows: [{ appName: 'Editor', windowTitle: 'a.ts', durationMs: 60_000 }],
      },
    ]);
    await engine.stop();
  });

  it('files a shot from a tick still in flight when the session stops without a session id', async () => {
    // Suspected race, recorded as-is: the foreground read is awaited mid-tick, so a stop that
    // lands during it lets the tick go on to capture after the session is gone.
    let release: (app: string) => void = () => undefined;
    const platform = enginePlatform();
    vi.mocked(platform.deps.foreground.sample).mockImplementationOnce(
      () =>
        new Promise<string>((resolve) => {
          release = resolve;
        }),
    );
    platform.captures.push(screen('d1'));
    const engine = await tracking(platform, ONE_SHOT);

    await vi.advanceTimersByTimeAsync(1000);
    await engine.stop();
    release('Editor');
    await vi.advanceTimersByTimeAsync(0);

    expect(platform.deps.capture).toHaveBeenCalledTimes(1);
    expect(platform.hooks.onCapture).toHaveBeenCalledTimes(1);
    expect(platform.deps.outbox.size).toBe(1);
    // The image key is session-capturedAt-display: the session part is empty.
    expect([...platform.images.keys()]).toEqual(['-2026-02-03T09_00_01.000Z-d1']);
    expect(engine.currentStatus).toBe('idle');
  });
});

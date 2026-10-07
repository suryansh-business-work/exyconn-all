import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TrackerEngine } from '../../src/engine';
import { TrackerAuthError } from '../../src/portal/portal-error';
import { ENGINE_SETTINGS, enginePlatform, queuedInterval, screen } from './engine-fixture';

const AT = '2026-02-03T08:00:00.000Z';

describe('TrackerEngine sync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-03T09:00:00.000Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('says there was nothing to upload, and when it looked', async () => {
    const platform = enginePlatform();
    const engine = new TrackerEngine(ENGINE_SETTINGS, platform.hooks, platform.deps);

    await expect(engine.syncNow()).resolves.toEqual({ kind: 'nothing' });
    expect(platform.latest()).toMatchObject({
      lastSyncAt: '2026-02-03T09:00:00.000Z',
      lastSyncOutcome: { kind: 'nothing' },
    });
  });

  it('closes the running bucket and uploads it on demand', async () => {
    const platform = enginePlatform();
    const engine = new TrackerEngine(ENGINE_SETTINGS, platform.hooks, platform.deps);
    await engine.start('project-1');
    await vi.advanceTimersByTimeAsync(3000);

    await expect(engine.syncNow()).resolves.toEqual({
      kind: 'uploaded',
      count: 1,
      discarded: 0,
    });
    expect(platform.deps.portal.syncIntervals).toHaveBeenCalledWith('session-1', [
      expect.objectContaining({ activeMs: 3000 }),
    ]);
    expect(engine.stats().pendingSync).toBe(0);
    await engine.stop();
  });

  it('uploads queued screenshots through the screenshot endpoint', async () => {
    const platform = enginePlatform();
    platform.deps.outbox.enqueueScreenshot({
      sessionId: 'session-0',
      intervalStartedAt: AT,
      capturedAt: AT,
      image: 'queued-image',
      displayId: 'd1',
      blurred: true,
    });
    const engine = new TrackerEngine(ENGINE_SETTINGS, platform.hooks, platform.deps);

    await engine.syncNow();

    expect(platform.deps.portal.uploadScreenshot).toHaveBeenCalledWith(
      expect.objectContaining({ image: 'queued-image', blurred: true, sessionId: 'session-0' }),
    );
    expect(platform.deps.portal.syncIntervals).not.toHaveBeenCalled();
  });

  it('turns a transient failure into a sentence and logs the original', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const platform = enginePlatform();
    const cause = new Error('HTTP 503');
    vi.mocked(platform.deps.portal.syncIntervals).mockRejectedValue(cause);
    platform.deps.outbox.enqueueInterval('session-0', queuedInterval(AT));
    const engine = new TrackerEngine(ENGINE_SETTINGS, platform.hooks, platform.deps);

    const outcome = await engine.syncNow();

    expect(outcome).toEqual({
      kind: 'failed',
      reason:
        'The portal is temporarily unavailable. Your work is saved and will upload automatically once it is back.',
    });
    expect(error).toHaveBeenCalledWith('Sync failed', cause);
    expect(platform.deps.outbox.size).toBe(1);
    expect(platform.hooks.onAuthError).not.toHaveBeenCalled();
    expect(platform.latest().lastSyncAt).toBeNull();
  });

  it('stops tracking and hands the shell the reason when access was revoked', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const platform = enginePlatform();
    vi.mocked(platform.deps.portal.syncIntervals).mockRejectedValue(new TrackerAuthError('gone'));
    const engine = new TrackerEngine(ENGINE_SETTINGS, platform.hooks, platform.deps);
    await engine.start('project-1');
    await vi.advanceTimersByTimeAsync(2000);

    await engine.syncNow();
    await vi.advanceTimersByTimeAsync(0);

    expect(platform.hooks.onAuthError).toHaveBeenCalledWith(
      'Your tracker access was removed. Ask your administrator to restore it, then sign in again.',
    );
    expect(engine.currentStatus).toBe('idle');
    // The queued work is kept for whoever signs in next, never thrown away.
    expect(platform.deps.outbox.size).toBe(1);
    expect(platform.deps.portal.stopSession).toHaveBeenCalled();
  });

  it('logs a stop that itself fails after an auth error', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const ended = new Error('could not release capture');
    const platform = enginePlatform({
      session: { begin: () => Promise.resolve(), end: () => Promise.reject(ended) },
    });
    vi.mocked(platform.deps.foreground.sample).mockRejectedValue(new TrackerAuthError('gone'));
    const engine = new TrackerEngine(ENGINE_SETTINGS, platform.hooks, platform.deps);
    await engine.start('project-1');

    await vi.advanceTimersByTimeAsync(1000);

    expect(platform.hooks.onAuthError).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith('Stop after auth error failed', ended);
  });

  it('shrugs off a tick failure that is not an auth error', async () => {
    const platform = enginePlatform();
    vi.mocked(platform.deps.foreground.sample).mockRejectedValueOnce(new Error('no window'));
    const engine = new TrackerEngine(ENGINE_SETTINGS, platform.hooks, platform.deps);
    await engine.start('project-1');

    await vi.advanceTimersByTimeAsync(2000);

    expect(engine.currentStatus).toBe('tracking');
    expect(platform.hooks.onAuthError).not.toHaveBeenCalled();
    expect(engine.stats().sessionActiveMs).toBe(2000);
    await engine.stop();
  });

  it('refuses a second sync while one is in flight', async () => {
    let finish: () => void = () => undefined;
    const platform = enginePlatform();
    vi.mocked(platform.deps.portal.syncIntervals).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    platform.deps.outbox.enqueueInterval('session-0', queuedInterval(AT));
    const engine = new TrackerEngine(ENGINE_SETTINGS, platform.hooks, platform.deps);

    const first = engine.syncNow();
    await vi.advanceTimersByTimeAsync(0);
    expect(engine.isSyncing).toBe(true);
    expect(platform.latest().syncing).toBe(true);

    await expect(engine.syncNow()).resolves.toEqual({
      kind: 'unavailable',
      reason: 'A sync is already running.',
    });
    finish();
    await expect(first).resolves.toEqual({ kind: 'uploaded', count: 1, discarded: 0 });
    expect(engine.isSyncing).toBe(false);
  });

  it('auto-syncs a waiting queue at once, then only on the configured cadence', async () => {
    const platform = enginePlatform();
    platform.deps.outbox.enqueueInterval('session-0', queuedInterval(AT));
    const engine = new TrackerEngine(
      { ...ENGINE_SETTINGS, screenshotsPerInterval: 1, syncIntervalMinutes: 1 },
      platform.hooks,
      platform.deps,
    );
    await engine.start('project-1');
    platform.captures.push(screen('d1'));

    await vi.advanceTimersByTimeAsync(1000);
    expect(platform.deps.portal.syncIntervals).toHaveBeenCalledTimes(1);
    expect(platform.deps.portal.uploadScreenshot).toHaveBeenCalledTimes(1);

    // A new item queued inside the cadence waits for it.
    platform.deps.outbox.enqueueInterval('session-0', queuedInterval(AT));
    await vi.advanceTimersByTimeAsync(30_000);
    expect(platform.deps.portal.syncIntervals).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(platform.deps.portal.syncIntervals).toHaveBeenCalledTimes(2);
    await engine.stop();
  });

  it('rejects when the queue cannot be saved, leaving the engine able to sync again', async () => {
    const platform = enginePlatform();
    platform.deps.outbox.enqueueInterval('session-0', queuedInterval(AT));
    platform.storage.failWrites = true;
    const engine = new TrackerEngine(ENGINE_SETTINGS, platform.hooks, platform.deps);

    await expect(engine.syncNow()).rejects.toThrow('Disk full');
    expect(engine.isSyncing).toBe(false);
  });
});

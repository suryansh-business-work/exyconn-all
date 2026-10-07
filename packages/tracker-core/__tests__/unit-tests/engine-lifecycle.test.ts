import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TrackerEngine } from '../../src/engine';
import { ENGINE_SETTINGS, enginePlatform, type EnginePlatform } from './engine-fixture';

function build(platform: EnginePlatform, settings = ENGINE_SETTINGS): TrackerEngine {
  return new TrackerEngine(settings, platform.hooks, platform.deps);
}

describe('TrackerEngine lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-03T09:00:00.000Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens one portal session however many times start is pressed', async () => {
    const platform = enginePlatform();
    const engine = build(platform);

    await engine.start('project-1', 'task-1');
    await engine.start('project-1');

    expect(platform.deps.portal.startSession).toHaveBeenCalledTimes(1);
    expect(platform.deps.portal.startSession).toHaveBeenCalledWith(
      '2026-02-03T09:00:00.000Z',
      'project-1',
      'task-1',
    );
    expect(engine.currentStatus).toBe('tracking');
    expect(platform.latest().status).toBe('tracking');
    await engine.stop();
  });

  it('books against the project alone when no ticket is given', async () => {
    const platform = enginePlatform();
    const engine = build(platform);

    await engine.start('project-1');

    expect(platform.deps.portal.startSession).toHaveBeenCalledWith(
      expect.any(String),
      'project-1',
      '',
    );
    await engine.stop();
  });

  it('rethrows a portal refusal on a platform with no session to release', async () => {
    const platform = enginePlatform();
    vi.mocked(platform.deps.portal.startSession).mockRejectedValue(new Error('No attendance'));
    const engine = build(platform);

    await expect(engine.start('project-1')).rejects.toThrow('No attendance');
    expect(engine.currentStatus).toBe('idle');
    expect(platform.deps.input.start).not.toHaveBeenCalled();
  });

  it('pauses and resumes input counting, ignoring out-of-order presses', async () => {
    const platform = enginePlatform();
    const engine = build(platform);

    engine.resume();
    engine.pause();
    expect(engine.currentStatus).toBe('idle');

    await engine.start('project-1');
    engine.pause();
    expect(engine.currentStatus).toBe('paused');
    expect(platform.deps.input.stop).toHaveBeenCalledTimes(1);
    engine.resume();
    expect(engine.currentStatus).toBe('tracking');
    expect(platform.deps.input.start).toHaveBeenCalledTimes(2);
    await engine.stop();
  });

  it('counts nothing while paused', async () => {
    const platform = enginePlatform();
    const engine = build(platform);
    await engine.start('project-1');
    await vi.advanceTimersByTimeAsync(3000);
    engine.pause();
    await vi.advanceTimersByTimeAsync(5000);

    expect(engine.stats().sessionActiveMs).toBe(3000);
    await engine.stop();
  });

  it('stops cleanly when no session was ever opened', async () => {
    const platform = enginePlatform();
    const engine = build(platform);

    await engine.stop();

    expect(platform.deps.portal.stopSession).not.toHaveBeenCalled();
    expect(engine.currentStatus).toBe('idle');
    expect(platform.latest().lastSyncOutcome).toBeNull();
  });

  it('still stops when the portal cannot close the session', async () => {
    const platform = enginePlatform();
    vi.mocked(platform.deps.portal.stopSession).mockRejectedValue(new Error('offline'));
    const engine = build(platform);
    await engine.start('project-1');

    await expect(engine.stop()).resolves.toBeUndefined();
    expect(engine.currentStatus).toBe('idle');
  });

  it('keeps the finished session in the day total after stopping', async () => {
    const platform = enginePlatform();
    const engine = build(platform);
    engine.setDayBase(60_000);
    await engine.start('project-1');
    await vi.advanceTimersByTimeAsync(5000);

    expect(engine.dayActiveMs).toBe(65_000);
    await engine.stop();
    expect(engine.dayActiveMs).toBe(65_000);
    expect(engine.stats().sessionActiveMs).toBe(0);
  });

  it('adds the live, not-yet-drained input to the session counts', async () => {
    const platform = enginePlatform();
    const engine = build(platform);
    await engine.start('project-1');
    platform.input.keys = 4;
    platform.input.clicks = 2;

    expect(engine.stats()).toMatchObject({ keyCount: 4, mouseCount: 2, currentApp: '' });
    await vi.advanceTimersByTimeAsync(1000);
    expect(engine.stats().currentApp).toBe('Editor');
    await engine.stop();
  });

  it('files the interval on stop with the input counted in it', async () => {
    const platform = enginePlatform();
    const engine = build(platform);
    await engine.start('project-1');
    await vi.advanceTimersByTimeAsync(2000);
    platform.input.keys = 7;
    platform.input.clicks = 3;

    await engine.stop();

    expect(platform.deps.portal.syncIntervals).toHaveBeenCalledWith('session-1', [
      expect.objectContaining({ keyCount: 7, mouseCount: 3, activeMs: 2000, idleMs: 0 }),
    ]);
  });

  it('queues no interval when the portal handed back an empty session id', async () => {
    const platform = enginePlatform();
    vi.mocked(platform.deps.portal.startSession).mockResolvedValue('');
    const engine = build(platform, { ...ENGINE_SETTINGS, intervalMinutes: 1 });
    await engine.start('project-1');

    await vi.advanceTimersByTimeAsync(61_000);

    expect(platform.deps.outbox.size).toBe(0);
    expect(engine.currentStatus).toBe('tracking');
    await engine.stop();
  });

  it('reads new settings on the next tick', async () => {
    const platform = enginePlatform();
    const engine = build(platform);
    await engine.start('project-1');
    engine.updateSettings({ ...ENGINE_SETTINGS, idleThresholdSeconds: 5 });
    platform.idle.seconds = 10;

    await vi.advanceTimersByTimeAsync(1000);

    expect(engine.stats().sessionIdleMs).toBeGreaterThan(0);
    await engine.stop();
  });
});

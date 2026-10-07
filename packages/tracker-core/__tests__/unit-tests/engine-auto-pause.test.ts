import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TrackerEngine } from '../../src/engine';
import { ENGINE_SETTINGS, enginePlatform } from './engine-fixture';

describe('TrackerEngine auto-pause', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-03T09:00:00.000Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('pauses itself once nobody has touched the device for the workspace limit', async () => {
    const platform = enginePlatform();
    const engine = new TrackerEngine(
      { ...ENGINE_SETTINGS, idleAutoPauseMinutes: 2, syncIntervalMinutes: 60 },
      platform.hooks,
      platform.deps,
    );
    await engine.start('project-1');
    await vi.advanceTimersByTimeAsync(5000);
    platform.idle.seconds = 120;

    await vi.advanceTimersByTimeAsync(1000);

    expect(engine.currentStatus).toBe('paused');
    expect(platform.hooks.onAutoPaused).toHaveBeenCalledWith(2);
    // The minutes worked before they walked away were queued, not left in memory.
    expect(platform.deps.outbox.size).toBe(1);
    expect(engine.stats().sessionActiveMs).toBe(5000);
    await engine.stop();
  });

  it('keeps counting below the limit', async () => {
    const platform = enginePlatform();
    const engine = new TrackerEngine(
      { ...ENGINE_SETTINGS, idleAutoPauseMinutes: 2 },
      platform.hooks,
      platform.deps,
    );
    await engine.start('project-1');
    platform.idle.seconds = 119;

    await vi.advanceTimersByTimeAsync(1000);

    expect(engine.currentStatus).toBe('tracking');
    expect(platform.hooks.onAutoPaused).not.toHaveBeenCalled();
    await engine.stop();
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { activeWindow, observe, drain } = vi.hoisted(() => ({
  activeWindow: vi.fn(),
  observe: vi.fn(),
  drain: vi.fn(() => [{ appName: 'Code', title: 'index.ts', durationMs: 1000 }]),
}));

vi.mock('get-windows', () => ({ activeWindow }));
vi.mock('@exyconn/tracker-core', () => ({
  ForegroundUsage: class {
    observe = observe;
    drain = drain;
  },
}));

import { WindowTracker } from '../../../../src/main/trackers/window-tracker';

beforeEach(() => {
  activeWindow.mockReset();
  observe.mockClear();
  drain.mockClear();
});

describe('WindowTracker', () => {
  it('credits the app and window in front and answers with the app’s name', async () => {
    activeWindow.mockResolvedValue({ title: 'index.ts — exyconn', owner: { name: 'Code' } });
    const tracker = new WindowTracker();

    await expect(tracker.sample(1_000)).resolves.toBe('Code');

    expect(observe).toHaveBeenCalledWith(1_000, 'Code', 'index.ts — exyconn');
  });

  it('samples the window in front on every call', async () => {
    activeWindow.mockResolvedValue({ title: 'a', owner: { name: 'Mail' } });
    const tracker = new WindowTracker();

    await tracker.sample(1_000);
    await tracker.sample(2_000);

    expect(activeWindow).toHaveBeenCalledTimes(2);
    expect(observe).toHaveBeenLastCalledWith(2_000, 'Mail', 'a');
  });

  it('calls a desktop with nothing in front Unknown', async () => {
    activeWindow.mockResolvedValue(undefined);

    await expect(new WindowTracker().sample(5)).resolves.toBe('Unknown');

    expect(observe).toHaveBeenCalledWith(5, 'Unknown', '');
  });

  it('calls it Unknown, never throws, when the OS will not say', async () => {
    activeWindow.mockRejectedValue(new Error('screen recording not granted'));

    await expect(new WindowTracker().sample(9)).resolves.toBe('Unknown');

    expect(observe).toHaveBeenCalledWith(9, 'Unknown', '');
  });

  it('drains the interval’s usage with the workspace’s title setting', () => {
    const tracker = new WindowTracker();

    expect(tracker.drain(60_000, false)).toEqual([
      { appName: 'Code', title: 'index.ts', durationMs: 1000 },
    ]);
    expect(drain).toHaveBeenCalledWith(60_000, false);
  });
});

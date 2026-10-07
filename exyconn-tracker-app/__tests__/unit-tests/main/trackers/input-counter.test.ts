import { beforeEach, describe, expect, it, vi } from 'vitest';

const { hook, listeners } = vi.hoisted(() => {
  const listeners = new Map<string, Set<() => void>>();
  return {
    listeners,
    hook: {
      on: vi.fn((event: string, fn: () => void) => {
        const set = listeners.get(event) ?? new Set();
        set.add(fn);
        listeners.set(event, set);
      }),
      off: vi.fn((event: string, fn: () => void) => listeners.get(event)?.delete(fn)),
      start: vi.fn(),
      stop: vi.fn(),
    },
  };
});

vi.mock('uiohook-napi', () => ({ uIOhook: hook }));

import { InputCounter } from '../../../../src/main/trackers/input-counter';

/** Fires an OS input event the way uiohook would, with a keycode the counter must never read. */
function fire(event: 'keydown' | 'mousedown', times = 1): void {
  for (let i = 0; i < times; i += 1) {
    for (const fn of listeners.get(event) ?? []) {
      (fn as (payload: unknown) => void)({ keycode: 30 });
    }
  }
}

beforeEach(() => {
  listeners.clear();
  hook.on.mockClear();
  hook.off.mockClear();
  hook.start.mockClear();
  hook.stop.mockClear();
});

describe('InputCounter', () => {
  it('counts key presses and clicks once started', () => {
    const counter = new InputCounter();
    counter.start();

    fire('keydown', 3);
    fire('mousedown', 2);

    expect(hook.start).toHaveBeenCalledTimes(1);
    expect(counter.peek()).toEqual({ keys: 3, clicks: 2 });
    counter.stop();
  });

  it('peek leaves the counts alone; drain hands them over and starts again from zero', () => {
    const counter = new InputCounter();
    counter.start();
    fire('keydown', 4);
    fire('mousedown');

    expect(counter.peek()).toEqual({ keys: 4, clicks: 1 });
    expect(counter.drain()).toEqual({ keys: 4, clicks: 1 });
    expect(counter.drain()).toEqual({ keys: 0, clicks: 0 });
    counter.stop();
  });

  it('hooks the OS only once however often it is started', () => {
    const counter = new InputCounter();

    counter.start();
    counter.start();

    expect(hook.start).toHaveBeenCalledTimes(1);
    expect(hook.on).toHaveBeenCalledTimes(2);
    counter.stop();
  });

  it('stops counting once stopped, and stopping twice unhooks once', () => {
    const counter = new InputCounter();
    counter.stop();
    expect(hook.stop).not.toHaveBeenCalled();

    counter.start();
    counter.stop();
    counter.stop();
    fire('keydown', 5);

    expect(hook.stop).toHaveBeenCalledTimes(1);
    expect(hook.off).toHaveBeenCalledTimes(2);
    expect(counter.peek()).toEqual({ keys: 0, clicks: 0 });
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { StoreAction } from '../../../src/runtime/store';
import { useReplyQueue } from '../../../src/runtime/useReplyQueue';
import { reply, runtimeOptions } from './runtime.fixtures';

function setup(activeKey = 'clinic') {
  const dispatch = vi.fn<(action: StoreAction) => void>();
  const onArrived = vi.fn();
  const opts = { current: runtimeOptions({ activeKey, onArrived }) };
  const hook = renderHook(() => useReplyQueue(dispatch, opts));
  const actions = () => dispatch.mock.calls.map(([action]) => action);
  return { dispatch, onArrived, hook, actions, queue: () => hook.result.current };
}

const typing = (on: boolean): StoreAction => ({ type: 'typing', demoKey: 'clinic', typing: on });

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(1000);
});

afterEach(() => {
  vi.useRealTimers();
  Reflect.deleteProperty(document, 'hidden');
});

describe('useReplyQueue', () => {
  it('does nothing for an empty batch of replies', () => {
    const { queue, dispatch } = setup();
    queue().enqueue('clinic', [], { lead: 0, pushed: false });
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('reveals replies one at a time behind "typing…", the lead delaying the first', () => {
    const { queue, actions } = setup();
    queue().enqueue('clinic', [reply('a', 500), reply('b', 300)], { lead: 200, pushed: false });
    expect(actions()).toEqual([typing(true)]);
    vi.advanceTimersByTime(699);
    expect(actions()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(actions().slice(1)).toEqual([
      {
        type: 'append',
        demoKey: 'clinic',
        message: { ...reply('a', 0).message, at: 1700 },
        unread: false,
      },
      typing(true),
    ]);
    vi.advanceTimersByTime(300);
    expect(actions().slice(3)).toEqual([
      {
        type: 'append',
        demoKey: 'clinic',
        message: { ...reply('b', 0).message, at: 2000 },
        unread: false,
      },
      typing(false),
    ]);
  });

  it('adds to the line already typing instead of starting a second one', () => {
    const { queue, actions } = setup();
    queue().enqueue('clinic', [reply('a', 100)], { lead: 0, pushed: false });
    queue().enqueue('clinic', [reply('b', 100)], { lead: 0, pushed: false });
    expect(actions()).toEqual([typing(true)]);
    vi.advanceTimersByTime(200);
    const appended = actions().filter((a) => a.type === 'append');
    expect(appended.map((a) => a.type === 'append' && a.message.id)).toEqual(['a', 'b']);
  });

  it('counts replies to a chat that is not on screen as unread, without announcing them', () => {
    const { queue, actions, onArrived } = setup('salon');
    queue().enqueue('clinic', [reply('a', 100)], { lead: 0, pushed: false });
    vi.advanceTimersByTime(100);
    expect(actions()[1]).toMatchObject({ type: 'append', unread: true });
    expect(onArrived).not.toHaveBeenCalled();
  });

  it('announces a reminder that lands in a chat that is not on screen', () => {
    const { queue, onArrived } = setup('salon');
    queue().enqueue('clinic', [reply('a', 100)], { lead: 0, pushed: true });
    vi.advanceTimersByTime(100);
    expect(onArrived).toHaveBeenCalledWith('clinic', { ...reply('a', 0).message, at: 1100 });
  });

  it('treats a hidden tab as away, even on the open chat', () => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    const { queue, actions, onArrived } = setup('clinic');
    queue().enqueue('clinic', [reply('a', 100)], { lead: 0, pushed: true });
    vi.advanceTimersByTime(100);
    expect(actions()[1]).toMatchObject({ type: 'append', unread: true });
    expect(onArrived).toHaveBeenCalledTimes(1);
  });

  it('does not announce a reminder in the chat being read', () => {
    const { queue, onArrived } = setup('clinic');
    queue().enqueue('clinic', [reply('a', 100)], { lead: 0, pushed: true });
    vi.advanceTimersByTime(100);
    expect(onArrived).not.toHaveBeenCalled();
  });

  it('forgets that a batch was pushed once its line has drained', () => {
    const { queue, onArrived } = setup('salon');
    queue().enqueue('clinic', [reply('a', 100)], { lead: 0, pushed: true });
    vi.advanceTimersByTime(100);
    queue().enqueue('clinic', [reply('b', 100)], { lead: 0, pushed: false });
    vi.advanceTimersByTime(100);
    expect(onArrived).toHaveBeenCalledTimes(1);
  });

  it('runs an idle callback at once, or after the line has finished typing', () => {
    const { queue } = setup();
    const now = vi.fn();
    queue().whenIdle('clinic', now);
    expect(now).toHaveBeenCalledTimes(1);

    const after = vi.fn();
    queue().enqueue('clinic', [reply('a', 100)], { lead: 0, pushed: false });
    queue().whenIdle('clinic', after);
    expect(after).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(after).toHaveBeenCalledTimes(1);
  });

  it('drops a reply still "typing" when the chat is cleared', () => {
    const { queue, actions } = setup();
    queue().enqueue('clinic', [reply('a', 100)], { lead: 0, pushed: false });
    queue().cancel('clinic');
    vi.advanceTimersByTime(100);
    expect(actions()).toEqual([typing(true)]);
    // A fresh line starts on the next batch.
    queue().enqueue('clinic', [reply('b', 50)], { lead: 0, pushed: false });
    vi.advanceTimersByTime(50);
    expect(actions().filter((a) => a.type === 'append')).toHaveLength(1);
  });

  it('runs a delayed callback once, and never after unmounting', () => {
    const { queue, hook } = setup();
    const ran = vi.fn();
    queue().later(ran, 100);
    vi.advanceTimersByTime(100);
    expect(ran).toHaveBeenCalledTimes(1);

    const dropped = vi.fn();
    queue().later(dropped, 100);
    hook.unmount();
    vi.advanceTimersByTime(100);
    expect(dropped).not.toHaveBeenCalled();
  });

  it('keeps the same queue object across renders', () => {
    const { hook } = setup();
    const first = hook.result.current;
    hook.rerender();
    expect(hook.result.current).toBe(first);
  });
});

import { afterEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  closeComms,
  focusTaken,
  minimizeComms,
  moveDock,
  openComms,
  readMemory,
  restoreComms,
  useCommsDock,
  useRemembered,
  writeMemory,
} from '../../../../src/records/comms/commsStore';
import { commsRequest, resetDock } from './comms-fixtures';

const SMS = commsRequest({ channel: 'SMS' });
const CALL = commsRequest({ channel: 'CALL' });
const SMS_KEY = 'SMS:CONTACT:c-1';
const CALL_KEY = 'CALL:CONTACT:c-1';

function renderDock() {
  return renderHook(() => useCommsDock());
}

const summary = (panels: ReturnType<typeof useCommsDock>['panels']) =>
  panels.map(({ key, minimized, focusPending }) => ({ key, minimized, focusPending }));

describe('commsStore', () => {
  afterEach(() => {
    resetDock();
  });

  it('starts empty and docked bottom-right', () => {
    const { result } = renderDock();

    expect(result.current).toEqual({ panels: [], position: null });
  });

  it('opens a panel expanded, keyed by channel, record type and id, wanting focus', () => {
    const { result } = renderDock();

    act(() => openComms(SMS));

    expect(result.current.panels).toEqual([
      { ...SMS, key: SMS_KEY, minimized: false, focusPending: true },
    ]);
  });

  it('turns the expanded panel into a pill when another one opens', () => {
    const { result } = renderDock();

    act(() => openComms(SMS));
    act(() => openComms(CALL));

    expect(summary(result.current.panels)).toEqual([
      { key: SMS_KEY, minimized: true, focusPending: false },
      { key: CALL_KEY, minimized: false, focusPending: true },
    ]);
  });

  it('brings an already open panel back to the front instead of opening it twice', () => {
    const { result } = renderDock();

    act(() => openComms(SMS));
    act(() => openComms(CALL));
    act(() => openComms(SMS));

    expect(summary(result.current.panels)).toEqual([
      { key: CALL_KEY, minimized: true, focusPending: false },
      { key: SMS_KEY, minimized: false, focusPending: true },
    ]);
  });

  it('minimizes only the named panel', () => {
    const { result } = renderDock();
    act(() => openComms(SMS));
    act(() => openComms(CALL));

    act(() => minimizeComms(CALL_KEY));

    expect(result.current.panels.map((panel) => panel.minimized)).toEqual([true, true]);
  });

  it('restores one panel and minimizes every other', () => {
    const { result } = renderDock();
    act(() => openComms(SMS));
    act(() => openComms(CALL));

    act(() => restoreComms(SMS_KEY));

    expect(summary(result.current.panels)).toEqual([
      { key: SMS_KEY, minimized: false, focusPending: true },
      { key: CALL_KEY, minimized: true, focusPending: false },
    ]);
  });

  it('clears the focus request of the named panel only', () => {
    const { result } = renderDock();
    act(() => openComms(SMS));
    act(() => restoreComms(SMS_KEY));
    act(() => openComms(CALL));
    act(() => restoreComms(SMS_KEY));
    act(() => openComms(CALL));

    act(() => focusTaken(SMS_KEY));

    expect(summary(result.current.panels)).toEqual([
      { key: SMS_KEY, minimized: true, focusPending: false },
      { key: CALL_KEY, minimized: false, focusPending: true },
    ]);
  });

  it('closes a panel and forgets only its own memory', () => {
    const { result } = renderDock();
    act(() => openComms(SMS));
    act(() => openComms(CALL));
    writeMemory(SMS_KEY, 'draft', 'hello');
    writeMemory(SMS_KEY, 'status', 'sent');
    writeMemory(CALL_KEY, 'ringing', true);

    act(() => closeComms(SMS_KEY));

    expect(result.current.panels.map((panel) => panel.key)).toEqual([CALL_KEY]);
    expect(readMemory(SMS_KEY, 'draft')).toBeUndefined();
    expect(readMemory(SMS_KEY, 'status')).toBeUndefined();
    expect(readMemory(CALL_KEY, 'ringing')).toBe(true);
  });

  it('remembers where the panel was dragged and re-docks it on null', () => {
    const { result } = renderDock();

    act(() => moveDock({ x: 40, y: 80 }));
    expect(result.current.position).toEqual({ x: 40, y: 80 });

    act(() => moveDock(null));
    expect(result.current.position).toBeNull();
  });

  it('stops telling an unmounted reader about changes', () => {
    const { result, unmount } = renderDock();
    unmount();

    act(() => openComms(SMS));

    expect(result.current.panels).toEqual([]);
  });

  describe('useRemembered', () => {
    it('starts from the initial value when the panel remembers nothing', () => {
      const { result } = renderHook(() => useRemembered(SMS_KEY, 'ringing', false));

      expect(result.current[0]).toBe(false);
    });

    it('keeps a value set before a remount, until the panel closes', () => {
      act(() => openComms(SMS));
      const first = renderHook(() => useRemembered(SMS_KEY, 'ringing', false));
      act(() => first.result.current[1](true));
      expect(first.result.current[0]).toBe(true);
      first.unmount();

      const second = renderHook(() => useRemembered(SMS_KEY, 'ringing', false));
      expect(second.result.current[0]).toBe(true);
      second.unmount();

      act(() => closeComms(SMS_KEY));
      const third = renderHook(() => useRemembered(SMS_KEY, 'ringing', false));
      expect(third.result.current[0]).toBe(false);
    });
  });
});

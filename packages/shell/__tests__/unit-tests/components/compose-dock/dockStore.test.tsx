import { afterEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  closeDockPanel,
  dockFocusTaken,
  maximizeDock,
  minimizeDockPanel,
  moveDock,
  openDockPanel,
  readMemory,
  resizeDock,
  restoreDockPanel,
  useDock,
  useRemembered,
  writeMemory,
} from '@/components/compose-dock';
import { dockRequest, resetDock } from './dock-fixtures';

const SMS = dockRequest();
const CALL = dockRequest({ key: 'CALL:CONTACT:c-1', title: 'Call' });

const summary = (panels: ReturnType<typeof useDock>['panels']) =>
  panels.map(({ key, minimized, focusPending }) => ({ key, minimized, focusPending }));

describe('dockStore', () => {
  afterEach(() => {
    resetDock();
  });

  it('starts empty and docked bottom-right', () => {
    const { result } = renderHook(() => useDock());

    expect(result.current).toEqual({ panels: [], position: null, size: null, maximized: false });
  });

  it('opens a window expanded and wanting focus, turning the open one into a pill', () => {
    const { result } = renderHook(() => useDock());

    act(() => openDockPanel(SMS));
    expect(result.current.panels).toEqual([{ ...SMS, minimized: false, focusPending: true }]);

    act(() => openDockPanel(CALL));
    expect(summary(result.current.panels)).toEqual([
      { key: SMS.key, minimized: true, focusPending: false },
      { key: CALL.key, minimized: false, focusPending: true },
    ]);
  });

  it('brings a window already open back to the front instead of opening it twice', () => {
    const { result } = renderHook(() => useDock());
    act(() => openDockPanel(SMS));
    act(() => openDockPanel(CALL));

    act(() => openDockPanel(SMS));

    expect(summary(result.current.panels)).toEqual([
      { key: CALL.key, minimized: true, focusPending: false },
      { key: SMS.key, minimized: false, focusPending: true },
    ]);
  });

  it('minimizes, restores and records focus for the named window only', () => {
    const { result } = renderHook(() => useDock());
    act(() => openDockPanel(SMS));
    act(() => openDockPanel(CALL));

    act(() => minimizeDockPanel(CALL.key));
    expect(result.current.panels.every((panel) => panel.minimized)).toBe(true);

    act(() => restoreDockPanel(SMS.key));
    expect(summary(result.current.panels)).toEqual([
      { key: SMS.key, minimized: false, focusPending: true },
      { key: CALL.key, minimized: true, focusPending: false },
    ]);

    act(() => dockFocusTaken(SMS.key));
    expect(result.current.panels[0].focusPending).toBe(false);
  });

  it('closes a window and forgets only its own memory', () => {
    const { result } = renderHook(() => useDock());
    act(() => openDockPanel(SMS));
    writeMemory(SMS.key, 'draft', 'Hello');
    writeMemory(CALL.key, 'draft', 'Hi');

    act(() => closeDockPanel(SMS.key));

    expect(result.current.panels).toEqual([]);
    expect(readMemory(SMS.key, 'draft')).toBeUndefined();
    expect(readMemory(CALL.key, 'draft')).toBe('Hi');
    closeDockPanel(CALL.key);
  });

  it('keeps where the window was moved, its size and whether it fills the screen', () => {
    const { result } = renderHook(() => useDock());

    act(() => {
      moveDock({ x: 10, y: 20 });
      resizeDock({ width: 400, height: 300 });
      maximizeDock(true);
    });

    expect(result.current).toMatchObject({
      position: { x: 10, y: 20 },
      size: { width: 400, height: 300 },
      maximized: true,
    });
  });

  it('remembers a value across remounts until the window closes', () => {
    const first = renderHook(() => useRemembered(SMS.key, 'status', 'idle'));
    expect(first.result.current[0]).toBe('idle');

    act(() => first.result.current[1]('ringing'));
    first.unmount();
    const second = renderHook(() => useRemembered(SMS.key, 'status', 'idle'));

    expect(second.result.current[0]).toBe('ringing');
    closeDockPanel(SMS.key);
  });
});

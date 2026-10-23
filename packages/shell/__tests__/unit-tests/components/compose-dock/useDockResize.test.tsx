import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useDock } from '@/components/compose-dock';
import {
  MIN_DOCK_SIZE,
  startDockResize,
  type ResizeEdge,
} from '@/components/compose-dock/useDockResize';
import { resetDock } from './dock-fixtures';

/** A 400x300 panel whose top-left corner sits at (100, 50) in a 1000x800 window. */
function makePanel() {
  const panel = document.createElement('div');
  panel.getBoundingClientRect = () => ({ left: 100, top: 50, width: 400, height: 300 }) as DOMRect;
  const handle = document.createElement('div');
  handle.setPointerCapture = vi.fn();
  panel.append(handle);
  document.body.append(panel);
  return { panel, handle };
}

function press(handle: HTMLElement, button = 0) {
  return {
    currentTarget: handle,
    button,
    clientX: 500,
    clientY: 350,
    pointerId: 3,
    preventDefault: vi.fn(),
  } as unknown as ReactPointerEvent<HTMLElement>;
}

function pull(handle: HTMLElement, clientX: number, clientY: number) {
  handle.dispatchEvent(new MouseEvent('pointermove', { clientX, clientY }));
}

function release(handle: HTMLElement) {
  act(() => {
    handle.dispatchEvent(new MouseEvent('pointerup'));
  });
}

describe('startDockResize', () => {
  let parts: ReturnType<typeof makePanel>;

  beforeEach(() => {
    globalThis.innerWidth = 1000;
    globalThis.innerHeight = 800;
    parts = makePanel();
  });

  afterEach(() => {
    parts.panel.remove();
    resetDock();
  });

  it('grows from the corner, pinned by its top-left, and stores the size and spot', () => {
    const dock = renderHook(() => useDock());

    startDockResize(parts.panel, 'corner', press(parts.handle));
    expect(parts.handle.setPointerCapture).toHaveBeenCalledWith(3);
    expect([parts.panel.style.left, parts.panel.style.top]).toEqual(['100px', '50px']);
    pull(parts.handle, 600, 450);

    expect(parts.panel.style.width).toBe('500px');
    expect(parts.panel.style.height).toBe('400px');
    expect(parts.panel.style.maxHeight).toBe('none');
    release(parts.handle);
    expect(dock.result.current.size).toEqual({ width: 500, height: 400 });
    expect(dock.result.current.position).toEqual({ x: 100, y: 50 });
  });

  it('never goes below the minimum size nor past the window edge', () => {
    const dock = renderHook(() => useDock());
    startDockResize(parts.panel, 'corner', press(parts.handle));

    pull(parts.handle, -5000, -5000);
    expect(parts.panel.style.width).toBe(`${MIN_DOCK_SIZE.width}px`);
    expect(parts.panel.style.height).toBe(`${MIN_DOCK_SIZE.height}px`);

    pull(parts.handle, 5000, 5000);
    act(() => {
      parts.handle.dispatchEvent(new MouseEvent('pointercancel'));
    });
    expect(dock.result.current.size).toEqual({ width: 900, height: 750 });
  });

  it.each([
    ['right', { width: 450, height: 300 }],
    ['bottom', { width: 400, height: 350 }],
  ] as [ResizeEdge, object][])('pulls only the %s edge', (edge, size) => {
    const dock = renderHook(() => useDock());

    startDockResize(parts.panel, edge, press(parts.handle));
    pull(parts.handle, 550, 400);
    release(parts.handle);

    expect(dock.result.current.size).toEqual(size);
  });

  it('stops following the pointer once it is released', () => {
    startDockResize(parts.panel, 'corner', press(parts.handle));
    release(parts.handle);
    parts.panel.style.width = '';

    pull(parts.handle, 700, 700);

    expect(parts.panel.style.width).toBe('');
  });

  it('ignores a press that is not the main button, or with no panel mounted', () => {
    startDockResize(parts.panel, 'corner', press(parts.handle, 2));
    startDockResize(null, 'corner', press(parts.handle));
    pull(parts.handle, 700, 700);

    expect(parts.handle.setPointerCapture).not.toHaveBeenCalled();
    expect(parts.panel.style.width).toBe('');
  });
});

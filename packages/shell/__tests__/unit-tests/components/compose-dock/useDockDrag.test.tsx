import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { moveDock, resizeDock, useDock } from '@/components/compose-dock';
import { useDockDrag } from '@/components/compose-dock/useDockDrag';
import { resetDock } from './dock-fixtures';

/** A 300x200 panel whose top-left corner sits at (100, 50) in a 1000x800 window. */
function makePanel() {
  const panel = document.createElement('div');
  panel.getBoundingClientRect = () => ({ left: 100, top: 50, width: 300, height: 200 }) as DOMRect;
  const handle = document.createElement('div');
  handle.setPointerCapture = vi.fn();
  const title = document.createElement('span');
  const button = document.createElement('button');
  handle.append(title, button);
  panel.append(handle);
  document.body.append(panel);
  return { panel, handle, title, button };
}

type Parts = ReturnType<typeof makePanel>;

function pressOn(
  target: HTMLElement,
  handle: HTMLElement,
  overrides: Partial<{ button: number; clientX: number; clientY: number }> = {},
) {
  return {
    target,
    currentTarget: handle,
    button: 0,
    clientX: 110,
    clientY: 60,
    pointerId: 7,
    ...overrides,
  } as unknown as ReactPointerEvent<HTMLElement>;
}

function moveTo(handle: HTMLElement, clientX: number, clientY: number) {
  handle.dispatchEvent(new MouseEvent('pointermove', { clientX, clientY }));
}

function renderDrag(parts: Parts | null, enabled = true) {
  const ref = { current: parts?.panel ?? null };
  const drag = renderHook(() => useDockDrag(ref, enabled));
  const dock = renderHook(() => useDock());
  return { drag, dock };
}

describe('useDockDrag', () => {
  let parts: Parts;

  beforeEach(() => {
    globalThis.innerWidth = 1000;
    globalThis.innerHeight = 800;
    parts = makePanel();
  });

  afterEach(() => {
    parts.panel.remove();
    resetDock();
  });

  it('moves the panel with the pointer, keeping the grab point, and stores the drop spot', () => {
    const { drag, dock } = renderDrag(parts);

    act(() => drag.result.current.onPointerDown(pressOn(parts.title, parts.handle)));
    expect(parts.handle.setPointerCapture).toHaveBeenCalledWith(7);
    moveTo(parts.handle, 310, 260);

    expect(parts.panel.style.left).toBe('300px');
    expect(parts.panel.style.top).toBe('250px');
    expect(parts.panel.style.right).toBe('auto');
    expect(parts.panel.style.bottom).toBe('auto');
    expect(dock.result.current.position).toBeNull();

    act(() => {
      parts.handle.dispatchEvent(new MouseEvent('pointerup'));
    });
    expect(dock.result.current.position).toEqual({ x: 300, y: 250 });
  });

  it('keeps the whole panel inside the window on every side', () => {
    const { drag, dock } = renderDrag(parts);
    act(() => drag.result.current.onPointerDown(pressOn(parts.title, parts.handle)));

    moveTo(parts.handle, -500, -500);
    expect([parts.panel.style.left, parts.panel.style.top]).toEqual(['0px', '0px']);

    moveTo(parts.handle, 5000, 5000);
    expect([parts.panel.style.left, parts.panel.style.top]).toEqual(['700px', '600px']);

    act(() => {
      parts.handle.dispatchEvent(new MouseEvent('pointercancel'));
    });
    expect(dock.result.current.position).toEqual({ x: 700, y: 600 });
  });

  it('pins the panel to the corner when the window is smaller than the panel', () => {
    globalThis.innerWidth = 200;
    globalThis.innerHeight = 100;
    const { drag, dock } = renderDrag(parts);

    act(() => drag.result.current.onPointerDown(pressOn(parts.title, parts.handle)));
    act(() => {
      parts.handle.dispatchEvent(new MouseEvent('pointerup'));
    });

    expect(dock.result.current.position).toEqual({ x: 0, y: 0 });
  });

  it('stops following the pointer once it is released', () => {
    const { drag } = renderDrag(parts);
    act(() => drag.result.current.onPointerDown(pressOn(parts.title, parts.handle)));
    act(() => {
      parts.handle.dispatchEvent(new MouseEvent('pointerup'));
    });

    moveTo(parts.handle, 400, 400);

    expect(parts.panel.style.left).toBe('');
  });

  it.each([
    ['dragging is off (phone)', false, 0, 'title'],
    ['the press is not the main button', true, 2, 'title'],
    ['the press is on a header button', true, 0, 'button'],
  ] as const)('ignores the press when %s', (_case, enabled, button, on) => {
    const { drag } = renderDrag(parts, enabled);

    act(() => drag.result.current.onPointerDown(pressOn(parts[on], parts.handle, { button })));
    moveTo(parts.handle, 400, 400);

    expect(parts.handle.setPointerCapture).not.toHaveBeenCalled();
    expect(parts.panel.style.left).toBe('');
  });

  it('ignores the press while the panel is not mounted', () => {
    const { drag } = renderDrag(null);

    act(() => drag.result.current.onPointerDown(pressOn(parts.title, parts.handle)));

    expect(parts.handle.setPointerCapture).not.toHaveBeenCalled();
  });

  it('puts the panel back in its corner at its default size when the window is resized, until unmounted', () => {
    const { drag, dock } = renderDrag(parts);
    act(() => {
      moveDock({ x: 300, y: 250 });
      resizeDock({ width: 500, height: 400 });
    });

    act(() => {
      globalThis.dispatchEvent(new Event('resize'));
    });
    expect(dock.result.current.position).toBeNull();
    expect(dock.result.current.size).toBeNull();

    drag.unmount();
    act(() => moveDock({ x: 10, y: 10 }));
    act(() => {
      globalThis.dispatchEvent(new Event('resize'));
    });
    expect(dock.result.current.position).toEqual({ x: 10, y: 10 });
  });
});

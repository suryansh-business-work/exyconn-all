import type { KeyboardEvent } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useRovingFocus } from '../../../../src/pages/status/useRovingFocus';

const keyEvent = (key: string) => {
  const preventDefault = vi.fn();
  return { event: { key, preventDefault } as unknown as KeyboardEvent, preventDefault };
};

/** Real, focusable elements registered through the hook's refs. */
function mountItems(itemProps: ReturnType<typeof useRovingFocus>['itemProps'], count: number) {
  return Array.from({ length: count }, (_, index) => {
    const button = document.createElement('button');
    document.body.append(button);
    itemProps(index).ref(button);
    return button;
  });
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('useRovingFocus', () => {
  it('starts on the last item, the only one in the tab order', () => {
    const { result } = renderHook(() => useRovingFocus(3));
    expect([0, 1, 2].map((index) => result.current.itemProps(index).tabIndex)).toEqual([-1, -1, 0]);
  });

  it('starts on the first slot when there are no items', () => {
    const { result } = renderHook(() => useRovingFocus(0));
    expect(result.current.itemProps(0).tabIndex).toBe(0);
  });

  it('jumps Home and End, focusing the item it lands on', () => {
    const { result } = renderHook(() => useRovingFocus(3));
    const items = mountItems(result.current.itemProps, 3);

    const home = keyEvent('Home');
    act(() => result.current.onKeyDown(home.event));
    expect(home.preventDefault).toHaveBeenCalled();
    expect(items[0]).toHaveFocus();
    expect(result.current.itemProps(0).tabIndex).toBe(0);

    act(() => result.current.onKeyDown(keyEvent('End').event));
    expect(items[2]).toHaveFocus();
  });

  it('clamps at both ends and follows focus that arrives by other means', () => {
    const { result } = renderHook(() => useRovingFocus(2));
    const items = mountItems(result.current.itemProps, 2);

    act(() => result.current.onKeyDown(keyEvent('ArrowRight').event));
    expect(items[1]).toHaveFocus();

    act(() => result.current.itemProps(0).onFocus());
    expect(result.current.itemProps(0).tabIndex).toBe(0);
    act(() => result.current.onKeyDown(keyEvent('ArrowLeft').event));
    expect(items[0]).toHaveFocus();
    expect(result.current.itemProps(0).tabIndex).toBe(0);
  });

  it('leaves any other key to the browser', () => {
    const { result } = renderHook(() => useRovingFocus(2));
    const tab = keyEvent('Tab');
    act(() => result.current.onKeyDown(tab.event));
    expect(tab.preventDefault).not.toHaveBeenCalled();
    expect(result.current.itemProps(1).tabIndex).toBe(0);
  });
});

import type { RefObject } from 'react';
import { renderHook } from '@testing-library/react';
import { AccessibilityInfo, type HostInstance, type Text } from 'react-native';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useReturnFocus } from '../../../src/hooks/useReturnFocus';
import { Platform } from '../mocks/react-native/apis';

/** A control on screen (connected to the document), as the native host instance it stands for. */
function onScreen(tag: string): HTMLElement {
  const element = document.createElement(tag);
  document.body.append(element);
  return element;
}

function refTo(element: HTMLElement | null): RefObject<HostInstance | null> {
  return { current: element } as unknown as RefObject<HostInstance | null>;
}

function render(open: boolean, opener: RefObject<HostInstance | null>) {
  return renderHook(({ isOpen }) => useReturnFocus(isOpen, opener), {
    initialProps: { isOpen: open },
  });
}

describe('useReturnFocus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("puts the screen reader on the pop-up's title when it opens", () => {
    const title = onScreen('span');
    const { result } = render(true, refTo(onScreen('button')));
    result.current.titleRef.current = title as unknown as Text;
    result.current.modalProps.onShow();
    expect(AccessibilityInfo.sendAccessibilityEvent).toHaveBeenCalledWith(title, 'focus');
  });

  it('does nothing on open when the title is not mounted', () => {
    const { result } = render(true, refTo(onScreen('button')));
    result.current.modalProps.onShow();
    expect(AccessibilityInfo.sendAccessibilityEvent).not.toHaveBeenCalled();
  });

  it('hands the screen reader back to the opener when iOS reports the dismissal', () => {
    const opener = onScreen('button');
    const { result } = render(true, refTo(opener));
    result.current.modalProps.onDismiss();
    expect(AccessibilityInfo.sendAccessibilityEvent).toHaveBeenCalledWith(opener, 'focus');
  });

  it('skips an opener that has left the screen', () => {
    const { result } = render(true, refTo(document.createElement('button')));
    result.current.modalProps.onDismiss();
    expect(AccessibilityInfo.sendAccessibilityEvent).not.toHaveBeenCalled();
  });

  it('waits out the Android dialog exit before returning focus', () => {
    Platform.OS = 'android';
    const opener = onScreen('button');
    const { rerender } = render(true, refTo(opener));
    rerender({ isOpen: false });
    vi.advanceTimersByTime(349);
    expect(AccessibilityInfo.sendAccessibilityEvent).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(AccessibilityInfo.sendAccessibilityEvent).toHaveBeenCalledWith(opener, 'focus');
  });

  it('cancels the Android return when the pop-up opens again first', () => {
    Platform.OS = 'android';
    const { rerender } = render(true, refTo(onScreen('button')));
    rerender({ isOpen: false });
    rerender({ isOpen: true });
    vi.advanceTimersByTime(1000);
    expect(AccessibilityInfo.sendAccessibilityEvent).not.toHaveBeenCalled();
  });

  it('schedules nothing on iOS, or for a pop-up that was never open', () => {
    const { rerender } = render(true, refTo(onScreen('button')));
    rerender({ isOpen: false });
    Platform.OS = 'android';
    const closed = render(false, refTo(onScreen('button')));
    closed.rerender({ isOpen: false });
    vi.advanceTimersByTime(1000);
    expect(AccessibilityInfo.sendAccessibilityEvent).not.toHaveBeenCalled();
  });
});

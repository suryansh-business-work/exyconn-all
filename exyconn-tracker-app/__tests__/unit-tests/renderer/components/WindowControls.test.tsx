// @vitest-environment jsdom
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import WindowControls from '../../../../src/renderer/components/WindowControls';
import { button, clickElement, render, stubTracker, unmountAll } from '../../test-utils';

afterEach(unmountAll);

describe('WindowControls', () => {
  it('minimises, maximises and closes the window it sits in', async () => {
    const minimizeWindow = vi.fn(() => Promise.resolve());
    const toggleMaximizeWindow = vi.fn(() => Promise.resolve(true));
    const closeWindow = vi.fn(() => Promise.resolve());
    stubTracker({
      minimizeWindow,
      toggleMaximizeWindow,
      closeWindow,
      onWindowMaximized: () => () => undefined,
    });
    await render(<WindowControls />);
    await clickElement(button('Minimise'));
    await clickElement(button('Maximise'));
    await clickElement(button('Close'));
    expect(minimizeWindow).toHaveBeenCalledTimes(1);
    expect(toggleMaximizeWindow).toHaveBeenCalledTimes(1);
    expect(closeWindow).toHaveBeenCalledTimes(1);
  });

  it('turns Maximise into Restore whenever the main process says the window is maximised', async () => {
    let report: (maximized: boolean) => void = () => undefined;
    const unsubscribe = vi.fn();
    stubTracker({
      onWindowMaximized: (listener) => {
        report = listener;
        return unsubscribe;
      },
    });
    await render(<WindowControls />);
    await act(async () => report(true));
    expect(button('Restore')).toBeDefined();
    await act(async () => report(false));
    expect(button('Maximise')).toBeDefined();
    unmountAll();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});

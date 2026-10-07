// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ThemeMode } from '@shared/types';
import ThemeToggleButton from '../../../../src/renderer/components/ThemeToggleButton';
import {
  button,
  clickElement,
  installTracker,
  overrideTracker,
  render,
  trackerState,
  unmountAll,
} from '../../test-utils';

const setPreferences = vi.fn(() => Promise.resolve());

beforeEach(() => {
  setPreferences.mockClear();
  installTracker(trackerState('idle'));
  overrideTracker({ setPreferences });
});
afterEach(unmountAll);

describe('ThemeToggleButton', () => {
  it.each<[ThemeMode, string, ThemeMode]>([
    ['system', 'Theme: Matching your system. Switch to light.', 'light'],
    ['light', 'Theme: Light. Switch to dark.', 'dark'],
    ['dark', 'Theme: Dark. Switch to matching your system.', 'system'],
  ])('cycles from %s, saying where it goes next', async (mode, hint, next) => {
    await render(<ThemeToggleButton mode={mode} />);
    await clickElement(button(hint));
    expect(setPreferences).toHaveBeenCalledWith({ themeMode: next });
  });

  it('takes the header’s round shape when asked', async () => {
    await render(<ThemeToggleButton mode="light" round />);
    const round = button('Theme: Light. Switch to dark.').className;
    unmountAll();
    await render(<ThemeToggleButton mode="light" />);
    expect(button('Theme: Light. Switch to dark.').className).not.toBe(round);
  });
});

// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ThemeModePicker from '../../../../src/renderer/components/ThemeModePicker';
import {
  buttonNamed,
  clickElement,
  installTracker,
  overrideTracker,
  render,
  trackerState,
  unmountAll,
} from '../../test-utils';
import { pageText } from './fixtures';

const setPreferences = vi.fn(() => Promise.resolve());

beforeEach(() => {
  setPreferences.mockClear();
  installTracker(trackerState('idle'));
  overrideTracker({ setPreferences });
});
afterEach(unmountAll);

describe('ThemeModePicker', () => {
  it('follows the operating system by default, and fixes a mode on request', async () => {
    await render(<ThemeModePicker mode="system" />);
    expect(buttonNamed('System').getAttribute('aria-pressed')).toBe('true');
    expect(pageText()).toContain('Following your operating system, and switching with it.');
    await clickElement(buttonNamed('Dark'));
    expect(setPreferences).toHaveBeenCalledWith({ themeMode: 'dark' });
  });

  it('says a fixed mode ignores the OS, and keeps it when pressed again', async () => {
    await render(<ThemeModePicker mode="light" />);
    expect(pageText()).toContain('Fixed to your choice, whatever the operating system does.');
    await clickElement(buttonNamed('Light'));
    expect(setPreferences).toHaveBeenCalledWith({ themeMode: 'light' });
  });
});

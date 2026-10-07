// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AppPreferences } from '@shared/types';
import TrayPreference from '../../../../src/renderer/components/TrayPreference';
import {
  clickElement,
  installTracker,
  overrideTracker,
  render,
  trackerState,
  unmountAll,
} from '../../test-utils';
import { pageText } from './fixtures';

afterEach(unmountAll);

const state = trackerState('idle');

function preferences(closeToTray: boolean): AppPreferences {
  return { ...state.preferences, closeToTray };
}

function toggle(): HTMLInputElement {
  const box = document.querySelector<HTMLInputElement>('input[type="checkbox"]');
  if (box === null) {
    throw new Error('No switch');
  }
  return box;
}

describe('TrayPreference', () => {
  it('says closing hides the window while on, and quits when switched off', async () => {
    installTracker(state);
    const setPreferences = vi.fn(() => Promise.resolve());
    overrideTracker({ setPreferences });
    await render(<TrayPreference preferences={preferences(true)} />);
    expect(pageText()).toContain('Closing the window hides it.');
    expect(toggle().checked).toBe(true);
    expect(toggle().getAttribute('aria-label')).toBe(
      'Keep running in the tray when the window is closed',
    );
    await clickElement(toggle());
    expect(setPreferences).toHaveBeenCalledWith({ closeToTray: false });
  });

  it('says closing quits the tracker while off', async () => {
    await render(<TrayPreference preferences={preferences(false)} />);
    expect(pageText()).toContain('Closing the window quits the tracker');
    expect(toggle().checked).toBe(false);
  });
});

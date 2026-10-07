// @vitest-environment jsdom
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AppPreferences } from '@shared/types';
import TransparencyPreference from '../../../../src/renderer/components/TransparencyPreference';
import {
  clickElement,
  render,
  rerender,
  stubTracker,
  trackerState,
  unmountAll,
} from '../../test-utils';
import { pageText } from './fixtures';

afterEach(unmountAll);

function preferences(transparentBackground: boolean, backgroundOpacity = 0.8): AppPreferences {
  return { ...trackerState('idle').preferences, transparentBackground, backgroundOpacity };
}

function supported() {
  const setPreferences = vi.fn(() => Promise.resolve(preferences(true)));
  stubTracker({ transparencySupported: true, setPreferences });
  return setPreferences;
}

function slider(): HTMLInputElement | null {
  return document.querySelector<HTMLInputElement>('input[type="range"]');
}

describe('TransparencyPreference', () => {
  it('is not offered on an OS with no window material to show through', async () => {
    stubTracker({ transparencySupported: false });
    await render(<TransparencyPreference preferences={preferences(true)} />);
    expect(document.body.textContent).toBe('');
  });

  it('keeps the window solid until switched on', async () => {
    const setPreferences = supported();
    await render(<TransparencyPreference preferences={preferences(false)} />);
    expect(pageText()).toContain('The window is painted solid.');
    expect(slider()).toBeNull();
    const toggle = document.querySelector<HTMLInputElement>('input[type="checkbox"]');
    if (toggle === null) {
      throw new Error('No switch');
    }
    await clickElement(toggle);
    expect(setPreferences).toHaveBeenCalledWith({ transparentBackground: true });
  });

  it('sets how much ground stays painted, and saves it once the slider is let go', async () => {
    const setPreferences = supported();
    await render(<TransparencyPreference preferences={preferences(true)} />);
    expect(pageText()).toContain('Your desktop shows through behind the cards.');
    expect(slider()?.getAttribute('aria-valuenow')).toBe('80');
    expect(slider()?.getAttribute('aria-label')).toBe('Background opacity');
    expect(slider()?.min).toBe('50');
    expect(slider()?.max).toBe('95');

    await act(async () => {
      slider()?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    });
    expect(slider()?.getAttribute('aria-valuenow')).toBe('85');
    expect(setPreferences).toHaveBeenCalledWith({ backgroundOpacity: 0.85 });
  });

  it('follows a value saved elsewhere', async () => {
    supported();
    await render(<TransparencyPreference preferences={preferences(true, 0.8)} />);
    await rerender(<TransparencyPreference preferences={preferences(true, 0.6)} />);
    expect(slider()?.getAttribute('aria-valuenow')).toBe('60');
  });
});

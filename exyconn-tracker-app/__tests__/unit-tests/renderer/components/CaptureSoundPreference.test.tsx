// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AppPreferences, TrackerSettings } from '@shared/types';
import CaptureSoundPreference from '../../../../src/renderer/components/CaptureSoundPreference';
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

function preferences(muteCaptureSound: boolean): AppPreferences {
  return { ...state.preferences, muteCaptureSound };
}

function settings(captureSoundEnabled: boolean): TrackerSettings | null {
  return state.settings === null ? null : { ...state.settings, captureSoundEnabled };
}

function toggle(): HTMLInputElement {
  const box = document.querySelector<HTMLInputElement>('input[type="checkbox"]');
  if (box === null) {
    throw new Error('No switch');
  }
  return box;
}

describe('CaptureSoundPreference', () => {
  it('explains the shutter, and mutes it on this computer when switched', async () => {
    installTracker(state);
    const setPreferences = vi.fn(() => Promise.resolve());
    overrideTracker({ setPreferences });
    await render(
      <CaptureSoundPreference preferences={preferences(false)} settings={settings(true)} />,
    );
    expect(pageText()).toContain('A camera shutter plays each time a screenshot is taken.');
    expect(toggle().getAttribute('aria-label')).toBe('Mute the camera shutter on this computer');
    await clickElement(toggle());
    expect(setPreferences).toHaveBeenCalledWith({ muteCaptureSound: true });
  });

  it('says captures are silent once muted, even before the workspace has answered', async () => {
    await render(<CaptureSoundPreference preferences={preferences(true)} settings={null} />);
    expect(pageText()).toContain('Screenshots are taken silently on this computer.');
    expect(toggle().disabled).toBe(false);
  });

  it('steps aside when the workspace has already turned the sound off', async () => {
    await render(
      <CaptureSoundPreference preferences={preferences(false)} settings={settings(false)} />,
    );
    expect(pageText()).toContain('Your workspace has already turned the capture sound off');
    expect(toggle().disabled).toBe(true);
  });
});

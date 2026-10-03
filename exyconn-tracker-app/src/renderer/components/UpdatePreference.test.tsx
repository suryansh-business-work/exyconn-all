// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AppPreferences, UpdateState } from '@shared/types';
import UpdatePreference from './UpdatePreference';
import { button, click, render, stubTracker, unmountAll } from '../a11y/component-harness';

afterEach(() => {
  unmountAll();
  vi.restoreAllMocks();
});

const PREFERENCES = { updateAutomatically: false } as AppPreferences;

function state(stage: UpdateState['stage'], lastCheckedAt: string | null = null): UpdateState {
  return { stage, version: '9.9.9', percent: 55, lastCheckedAt };
}

describe('UpdatePreference', () => {
  it('spins on Check for updates while a check runs', async () => {
    await render(<UpdatePreference preferences={PREFERENCES} update={state('checking')} />);
    expect(button('Check for updates').className).toContain('MuiButton-loading');
    expect(document.querySelector('[role="progressbar"][aria-valuenow]')).toBeNull();
  });

  it('shows the download’s progress, and holds the check until it is done', async () => {
    await render(<UpdatePreference preferences={PREFERENCES} update={state('downloading')} />);
    const check = button('Check for updates');
    expect(check.disabled).toBe(true);
    expect(check.className).not.toContain('MuiButton-loading');
    expect(document.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe(
      '55',
    );
  });

  it.each([
    [state('ready'), 'Version 9.9.9 is ready'],
    [state('available'), 'Version 9.9.9 is available.'],
    [state('failed'), 'could not reach the update service'],
    [state('idle'), 'Not checked yet'],
    [state('idle', new Date().toISOString()), 'Up to date — checked'],
  ])('says where the update stands (%#)', async (update, text) => {
    await render(<UpdatePreference preferences={PREFERENCES} update={update} />);
    expect(document.body.textContent).toContain(text);
  });

  it('saves the automatic-update choice and checks on request', async () => {
    const setPreferences = vi.fn(() => Promise.resolve(PREFERENCES));
    const checkForUpdate = vi.fn(() => Promise.resolve());
    stubTracker({ setPreferences, checkForUpdate });
    await render(
      <UpdatePreference
        preferences={{ updateAutomatically: true } as AppPreferences}
        update={state('idle')}
      />,
    );
    expect(document.body.textContent).toContain('download in the background');
    const box = document.querySelector<HTMLInputElement>('input[type="checkbox"]');
    if (box === null) {
      throw new Error('No checkbox');
    }
    await click(box);
    await click(button('Check for updates'));
    expect(setPreferences).toHaveBeenCalledWith({ updateAutomatically: false });
    expect(checkForUpdate).toHaveBeenCalled();
    expect(() => button('No such button')).toThrow('No button named "No such button"');
  });
});

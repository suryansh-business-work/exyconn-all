// @vitest-environment jsdom
import { act } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Branding, TrackerState } from '@shared/types';
import SettingsScreen from '../../../../src/renderer/screens/SettingsScreen';
import {
  buttonNamed,
  cleanup,
  installDomShims,
  installTracker,
  overrideTracker,
  render,
  settle,
  trackerState,
  unmountAll,
} from '../../test-utils';

beforeAll(installDomShims);
afterEach(() => {
  unmountAll();
  cleanup();
  vi.restoreAllMocks();
});

const BRANDING: Branding = {
  businessName: 'Acme',
  legalName: 'Acme Holdings Ltd',
  slogan: '',
  logoUrl: '',
  logoDarkUrl: '',
  appIconUrl: '',
  faviconUrl: '',
  primaryColor: '#1d4ed8',
  secondaryColor: '#9333ea',
  accentColor: '#f59e0b',
  backgroundColor: '#ffffff',
  textColor: '#111827',
  supportEmail: 'help@acme.test',
  websiteUrl: '',
  copyrightText: '',
};

async function open(
  state: TrackerState,
  branding: Branding | null,
  overrides: Parameters<typeof overrideTracker>[0] = {},
): Promise<void> {
  installTracker(state);
  overrideTracker(overrides);
  await render(
    <SettingsScreen
      settings={state.settings}
      branding={branding}
      timezone={state.timezone}
      preferences={state.preferences}
      workProfile={state.workProfile}
    />,
  );
  await settle();
}

describe('SettingsScreen', () => {
  it('lists what the workspace configured, and who to ask about it', async () => {
    await open(trackerState('idle'), BRANDING);
    const text = document.body.textContent ?? '';
    expect(text).toContain('Workspace settings');
    expect(text).not.toContain('Settings are not available right now.');
    expect(text).toContain('Version 1.0.0');
    expect(text).toContain('Acme Holdings Ltd');
    expect(text).toContain('Support: help@acme.test');
  });

  it('opens the employee’s own data in the portal', async () => {
    const openPrivacy = vi.fn(() => Promise.resolve());
    await open(trackerState('idle'), BRANDING, { openPrivacy });
    await act(async () => buttonNamed('View my data in the portal').click());
    expect(openPrivacy).toHaveBeenCalledTimes(1);
  });

  it('logs, rather than drops, a portal link that would not open', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await open(trackerState('idle'), null, {
      openPrivacy: () => Promise.reject(new Error('No browser')),
    });
    await act(async () => buttonNamed('View my data in the portal').click());
    await settle();
    expect(log).toHaveBeenCalledWith('Tracker action failed', expect.any(Error));
  });

  it('says the settings are unavailable, and leaves out what it does not know', async () => {
    const state = { ...trackerState('idle'), settings: null, workProfile: null };
    await open(state, null, { getAppVersion: () => Promise.resolve('') });
    expect(document.body.textContent).toContain('Settings are not available right now.');
    const about = [...document.querySelectorAll('h2')].find(
      (heading) => heading.textContent === 'About',
    )?.parentElement;
    expect(about?.textContent).toContain('Keystrokes and clicks are counted, never recorded.');
    expect(about?.textContent).not.toContain('Version');
    expect(about?.textContent).not.toContain('Support:');
  });

  it('names the business when the portal has no legal name, rather than an empty line', async () => {
    await open(trackerState('idle'), { ...BRANDING, legalName: '' });
    const text = document.body.textContent ?? '';
    expect(text).toContain('Acme');
    expect(text).not.toContain('Acme Holdings Ltd');
  });
});

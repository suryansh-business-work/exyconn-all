// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import ConsentScreen from './ConsentScreen';
import { trackerState } from '../a11y/tracker-fixture';
import { cleanup, installDomShims, mount } from '../a11y/render-harness';
import {
  buttonNamed,
  deferred,
  errorText,
  finish,
  isLoading,
  overrideTracker,
  press,
  typeInto,
} from '../a11y/component-harness';

beforeAll(installDomShims);
afterEach(cleanup);

const state = trackerState('consent-required');

describe('ConsentScreen', () => {
  it('spins on the agree button and holds "Not now" while the agreement is recorded', async () => {
    await mount(<ConsentScreen branding={null} settings={state.settings} policy={null} />, state);
    const recording = deferred();
    overrideTracker({ acceptConsent: () => recording.promise });

    await press(buttonNamed('I understand and agree'));
    expect(isLoading(buttonNamed('I understand and agree'))).toBe(true);
    expect(buttonNamed('Not now').disabled).toBe(true);

    await finish(() => recording.reject(new Error('')));
    expect(errorText()).toBe('Could not record your agreement.');
  });

  it('spins on "Not now" and says so when signing out fails', async () => {
    await mount(<ConsentScreen branding={null} settings={state.settings} policy={null} />, state);
    const leaving = deferred();
    overrideTracker({ logout: () => leaving.promise });

    await press(buttonNamed('Not now'));
    expect(isLoading(buttonNamed('Not now'))).toBe(true);

    await finish(() => leaving.reject(new Error('')));
    expect(errorText()).toBe('Could not sign out. Check your connection and try again.');
  });
});

describe('ConsentScreen wording', () => {
  it('asks for a signature on a policy that requires one, and enables agree once typed', async () => {
    const policy = {
      id: 'pol-1',
      title: 'Monitoring policy',
      slug: 'monitoring',
      summary: '',
      body: '<p>We record your screen.</p>',
      version: 3,
      requiresAcknowledgement: true,
      acknowledged: false,
    };
    await mount(<ConsentScreen branding={null} settings={state.settings} policy={policy} />, state);
    expect(document.body.textContent).toContain('Version 3');
    expect(buttonNamed('Sign and agree').disabled).toBe(true);
    const name = document.querySelector<HTMLInputElement>('input')!;
    await typeInto(name, 'Asha Rao');
    expect(buttonNamed('Sign and agree').disabled).toBe(false);
  });

  it('refuses agreement to nothing, and leaves the webcam line out when it is off', async () => {
    const settings = { ...state.settings!, consentText: ' ', webcamEnabled: false };
    await mount(<ConsentScreen branding={null} settings={settings} policy={null} />, state);
    expect(document.body.textContent).toContain('has not published a monitoring disclosure');
    expect(buttonNamed('I understand and agree').disabled).toBe(true);
  });

  it('has nothing to show before the workspace settings arrive', async () => {
    await mount(<ConsentScreen branding={null} settings={null} policy={null} />, state);
    expect(buttonNamed('I understand and agree').disabled).toBe(true);
  });
});

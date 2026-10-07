// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { ConsentPolicy, TrackerSettings } from '@shared/types';
import { WEBCAM_DISCLOSURE } from '@shared/config';
import ConsentScreen from '../../../../src/renderer/screens/ConsentScreen';
import {
  buttonNamed,
  cleanup,
  finish,
  installDomShims,
  mount,
  overrideTracker,
  pressButton,
  trackerState,
  typeInto,
} from '../../test-utils';

beforeAll(installDomShims);
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const state = trackerState('consent-required');
const SETTINGS = state.settings as TrackerSettings;

const POLICY: ConsentPolicy = {
  id: 'pol-1',
  title: 'Workplace monitoring policy',
  slug: 'monitoring',
  summary: '',
  body: '<p>We record your screen while you track.</p>',
  version: 4,
  requiresAcknowledgement: true,
  acknowledged: false,
};

function heading(): string | null | undefined {
  return document.querySelector('h1')?.textContent;
}

describe('ConsentScreen disclosure', () => {
  it('shows the workspace’s own consent text, and states the webcam itself', async () => {
    await mount(<ConsentScreen branding={null} settings={SETTINGS} policy={null} />, state);
    expect(heading()).toBe('Before you start');
    expect(document.body.textContent).toContain(
      'This app records your screen while tracking is on.',
    );
    expect(document.body.textContent).toContain(WEBCAM_DISCLOSURE);
    expect(buttonNamed('I understand and agree').disabled).toBe(false);
    expect(document.querySelector('input')).toBeNull();
  });

  it('records a plain agreement with no signature', async () => {
    const acceptConsent = vi.fn((_name: string) => Promise.resolve());
    await mount(<ConsentScreen branding={null} settings={SETTINGS} policy={null} />, state);
    overrideTracker({ acceptConsent });
    await pressButton(buttonNamed('I understand and agree'));
    await finish(() => undefined);
    expect(acceptConsent).toHaveBeenCalledWith('');
  });

  it('shows a chosen policy’s title and wording in place of the consent text', async () => {
    await mount(<ConsentScreen branding={null} settings={SETTINGS} policy={POLICY} />, state);
    expect(heading()).toBe('Workplace monitoring policy');
    expect(document.body.textContent).toContain('Version 4 of your workspace');
    expect(document.body.textContent).toContain('We record your screen while you track.');
    expect(document.body.textContent).not.toContain(
      'This app records your screen while tracking is on.',
    );
  });

  it('signs with the typed name, trimmed, and refuses a name of only spaces', async () => {
    const acceptConsent = vi.fn((_name: string) => Promise.resolve());
    await mount(<ConsentScreen branding={null} settings={SETTINGS} policy={POLICY} />, state);
    overrideTracker({ acceptConsent });
    const name = document.querySelector<HTMLInputElement>('input');
    if (name === null) {
      throw new Error('No signature field');
    }
    await typeInto(name, '   ');
    expect(buttonNamed('Sign and agree').disabled).toBe(true);
    await typeInto(name, '  Asha Rao  ');
    await pressButton(buttonNamed('Sign and agree'));
    await finish(() => undefined);
    expect(acceptConsent).toHaveBeenCalledWith('Asha Rao');
  });

  it('accepts a policy that needs no signature with a plain agreement', async () => {
    const policy = { ...POLICY, requiresAcknowledgement: false };
    await mount(<ConsentScreen branding={null} settings={null} policy={policy} />, state);
    expect(document.querySelector('input')).toBeNull();
    expect(document.body.textContent).not.toContain(WEBCAM_DISCLOSURE);
    expect(buttonNamed('I understand and agree').disabled).toBe(false);
  });
});

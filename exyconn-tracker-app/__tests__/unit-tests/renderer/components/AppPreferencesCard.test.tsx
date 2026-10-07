// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import AppPreferencesCard from '../../../../src/renderer/components/AppPreferencesCard';
import { installTracker, render, trackerState, unmountAll } from '../../test-utils';
import { pageText } from './fixtures';

afterEach(unmountAll);

describe('AppPreferencesCard', () => {
  it('gathers every choice this computer offers under one card', async () => {
    const state = trackerState('idle');
    installTracker(state);
    await render(
      <AppPreferencesCard
        preferences={state.preferences}
        settings={null}
        update={{ stage: 'idle', version: '', percent: 0, lastCheckedAt: null }}
      />,
    );
    expect(document.querySelector('h2')?.textContent).toBe('This app');
    expect(pageText()).toContain('Keep running in the tray');
    expect(pageText()).toContain('Mute the screenshot sound');
    expect(pageText()).toContain('Appearance');
    expect(pageText()).toContain('Today’s progress');
    expect(pageText()).toContain('Check for updates');
    // The fixture's OS has no window material, so the transparency switch is not offered.
    expect(pageText()).not.toContain('Transparent background');
  });
});

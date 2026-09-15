// @vitest-environment jsdom
import { act } from 'react';
import axe from 'axe-core';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import App from '../App';
import ScreenshotsApp from '../ScreenshotsApp';
import { trackerState } from './tracker-fixture';
import { cleanup, click, installDomShims, mount, settle, unmount } from './render-harness';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const AXE_OPTIONS: axe.RunOptions = {
  runOnly: { type: 'tag', values: WCAG_TAGS },
  // jsdom has no layout or paint, so axe cannot compute colour contrast here. Contrast is
  // covered by the theme token tests (packages/ui contrast tests and the tracker theme test).
  rules: { 'color-contrast': { enabled: false } },
};

beforeAll(installDomShims);

afterEach(cleanup);

/** Every WCAG A/AA violation axe finds in the whole document, portals included. */
async function violations(): Promise<string[]> {
  const result = await axe.run(document.body, AXE_OPTIONS);
  return result.violations.map(
    (violation) =>
      `${violation.id}: ${violation.help} — ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`,
  );
}

// Whole screens through axe run near vitest's 5s default, and past it under coverage in CI.
describe('renderer meets WCAG 2.2 A/AA (axe)', { timeout: 30_000 }, () => {
  it('login screen', async () => {
    await mount(<App />, trackerState('signed-out'));
    expect(document.querySelector('h1')).not.toBeNull();
    expect(await violations()).toEqual([]);
  });

  it('dashboard in the app shell', async () => {
    await mount(<App />, trackerState('tracking'));
    expect(document.querySelectorAll('main')).toHaveLength(1);
    // Spoken through the one shared live region, not by the Alert that draws it.
    expect(document.querySelector('[role="status"]')?.textContent).toContain(
      'Version 9.9.9 is available.',
    );
    expect(document.querySelector('.MuiAlert-root')?.getAttribute('role')).toBe('none');
    expect(await violations()).toEqual([]);
  });

  it.each([
    ['My Report', 'Report'],
    ['Messages', 'Messages'],
    ['Off-computer time', 'Off-computer'],
    ['Settings', 'Settings'],
  ])('%s screen', async (title, tab) => {
    await mount(<App />, trackerState('idle'));
    await click(`[role="tab"][aria-label^="${tab}"]`);
    expect(document.querySelector('h1')?.textContent).toBe(title);
    expect(await violations()).toEqual([]);
  });

  it.each(['Calendar', 'Days'])('My Report, %s tab', async (view) => {
    await mount(<App />, trackerState('idle'));
    await click('[role="tab"][aria-label^="Report"]');
    const tab = [...document.querySelectorAll<HTMLElement>('[role="tab"]')].find(
      (element) => element.textContent === view,
    );
    await act(async () => tab?.click());
    await settle();
    expect(document.querySelector('[role="tabpanel"] [role="tabpanel"]')).not.toBeNull();
    expect(await violations()).toEqual([]);
  });

  it('off-computer claim form', async () => {
    await mount(<App />, trackerState('idle'));
    await click('[role="tab"][aria-label^="Off-computer"]');
    await click('main button.MuiButton-contained');
    expect(document.querySelector('main form')).not.toBeNull();
    expect(await violations()).toEqual([]);
  });

  it('consent and permissions gates', async () => {
    await mount(<App />, trackerState('consent-required'));
    expect(await violations()).toEqual([]);
    unmount();
    const state = trackerState('idle');
    const permissions = { ...state.permissions, accessibility: false, allGranted: false };
    await mount(<App />, { ...state, permissions });
    expect(document.querySelector('h1')?.textContent).toBe('Grant permissions');
    expect(await violations()).toEqual([]);
  });

  it('screenshots gallery and its lightbox', async () => {
    await mount(<ScreenshotsApp />, trackerState('idle'));
    expect(await violations()).toEqual([]);
    await click('main button[aria-label^="Open the screenshot"]');
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    expect(await violations()).toEqual([]);
  });

  it('sets the document language and direction from the locale', async () => {
    await mount(<App />, { ...trackerState('idle'), locale: 'ar' });
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
  });
});

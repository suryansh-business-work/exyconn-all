// @vitest-environment jsdom
import type { ReactElement } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import axe from 'axe-core';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { TrackerState } from '@shared/types';
import App from '../App';
import ScreenshotsApp from '../ScreenshotsApp';
import { installTracker, trackerState } from './tracker-fixture';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const AXE_OPTIONS: axe.RunOptions = {
  runOnly: { type: 'tag', values: WCAG_TAGS },
  // jsdom has no layout or paint, so axe cannot compute colour contrast here. Contrast is
  // covered by the theme token tests (packages/ui contrast tests and the tracker theme test).
  rules: { 'color-contrast': { enabled: false } },
};

let root: Root | null = null;

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  // jsdom implements none of these; the screens only need them to exist.
  Element.prototype.scrollIntoView = () => undefined;
  Object.defineProperty(globalThis, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }),
  });
});

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  document.body.innerHTML = '';
});

/** Lets every mocked IPC promise, and the render it triggers, settle. */
async function settle(): Promise<void> {
  for (let pass = 0; pass < 5; pass += 1) {
    await act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
  }
}

async function mount(element: ReactElement, state: TrackerState): Promise<void> {
  installTracker(state);
  const container = document.createElement('div');
  container.id = 'root';
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root?.render(element));
  await settle();
}

async function click(selector: string): Promise<void> {
  const target = document.querySelector<HTMLElement>(selector);
  expect(target, selector).not.toBeNull();
  await act(async () => target?.click());
  await settle();
}

/**
 * Every WCAG A/AA violation axe finds in the whole document, portals included. `exclude` is for
 * a known gap owned by a shared package, never for this app's own markup.
 */
async function violations(exclude: string[] = []): Promise<string[]> {
  const context = { include: [document.body], exclude: exclude.map((selector) => [selector]) };
  const result = await axe.run(context, AXE_OPTIONS);
  return result.violations.map(
    (violation) =>
      `${violation.id}: ${violation.help} — ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`,
  );
}

describe('renderer meets WCAG 2.2 A/AA (axe)', () => {
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
    // @exyconn/ui's BarChart/TrendChart canvases carry role="img" with no name, and take no
    // prop to give them one; ChartCard's table view is the text alternative until that lands.
    expect(await violations(['canvas'])).toEqual([]);
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
    act(() => root?.unmount());
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

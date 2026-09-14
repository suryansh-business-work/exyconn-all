// @vitest-environment jsdom
import { act } from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import ScreenshotsApp from '../ScreenshotsApp';
import { trackerState } from './tracker-fixture';
import { cleanup, click, installDomShims, mount, press, settle } from './render-harness';

beforeAll(installDomShims);

// Only `Date` is faked: the calendar opens on "today", and the fixture's report day is fixed.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 20, 12));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function dialog(): Element | null {
  return document.querySelector('[role="dialog"]');
}

describe('dialogs close on Escape and hand focus back to their opener', () => {
  it('screenshot lightbox', async () => {
    await mount(<ScreenshotsApp />, trackerState('idle'));
    const opener = await click('main button[aria-label^="Open the screenshot"]');
    expect(dialog()).not.toBeNull();
    await press('Escape');
    expect(dialog()).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it('stat tile detail', async () => {
    await mount(<App />, trackerState('tracking'));
    const opener = await click('main button[aria-label$="Open details"]');
    expect(dialog()).not.toBeNull();
    await press('Escape');
    expect(dialog()).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it('off-computer claim form, which swaps in place of the list', async () => {
    await mount(<App />, trackerState('idle'));
    await click('[role="tab"][aria-label^="Off-computer"]');
    await click('main button.MuiButton-contained');
    expect(document.activeElement?.textContent).toBe('Claim off-computer time');
    const cancel = [...document.querySelectorAll<HTMLElement>('main form button')].find(
      (button) => button.textContent === 'Cancel',
    );
    cancel?.focus();
    await act(async () => cancel?.click());
    await settle();
    expect(document.querySelector('main form')).toBeNull();
    expect(document.activeElement?.textContent).toBe('Claim time');
  });
});

describe('report calendar', () => {
  it('names a tracked day with its time and activity level, and hides the dot', async () => {
    await mount(<App />, trackerState('idle'));
    await click('[role="tab"][aria-label^="Report"]');
    const calendarTab = [...document.querySelectorAll<HTMLElement>('[role="tab"]')].find(
      (tab) => tab.textContent === 'Calendar',
    );
    await act(async () => calendarTab?.click());
    await settle();
    const day = document.querySelector('[role="gridcell"][aria-label]');
    expect(day?.getAttribute('aria-label')).toBe('Mon 14 Sep, 1h 10m tracked, high activity');
    expect(day?.nextElementSibling?.getAttribute('aria-hidden')).toBe('true');
  });
});

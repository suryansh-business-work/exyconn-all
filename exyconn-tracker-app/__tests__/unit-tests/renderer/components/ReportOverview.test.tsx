// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import ReportOverview from '../../../../src/renderer/components/ReportOverview';
import { flush, render, stubTracker, unmountAll } from '../../test-utils';
import { pageText } from './fixtures';

afterEach(() => {
  unmountAll();
  vi.restoreAllMocks();
});

describe('ReportOverview', () => {
  it('says the period could not be read, and still draws the empty figures', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    stubTracker({ getReport: () => Promise.reject(new Error('Offline')) });
    await render(<ReportOverview timezone="UTC" />);
    await flush();
    expect(document.querySelector('.MuiAlert-colorError')?.textContent).toBe(
      'Could not load your insights. Check your connection and try again.',
    );
    expect(document.querySelectorAll('.MuiSkeleton-root')).toHaveLength(0);
    expect(pageText()).toContain('Keystrokes');
    expect(document.querySelector('svg[role="img"]')).not.toBeNull();
  });

  it('marks the period showing, and draws the other as a plain chip', async () => {
    stubTracker({ getReport: () => Promise.resolve([]) });
    await render(<ReportOverview timezone="UTC" />);
    await flush();
    const chips = [...document.querySelectorAll('[aria-pressed]')];
    expect(chips.map((chip) => [chip.textContent, chip.getAttribute('aria-pressed')])).toEqual([
      ['Last 7 days', 'true'],
      ['Last 30 days', 'false'],
    ]);
    expect(document.querySelector('svg[role="img"]')?.getAttribute('aria-label')).toBe(
      'Hours worked per day, last 7 days; 0 days tracked.',
    );
  });
});

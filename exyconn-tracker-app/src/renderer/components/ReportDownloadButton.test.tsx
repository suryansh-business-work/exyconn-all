// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReportDay, SavedReport } from '@shared/types';
import ReportDownloadButton from './ReportDownloadButton';
import {
  button,
  click,
  deferred,
  flush,
  render,
  stubTracker,
  unmountAll,
} from '../a11y/component-harness';

afterEach(() => {
  unmountAll();
  vi.restoreAllMocks();
});

const DAYS: ReportDay[] = [
  { date: '2026-09-14', activeMs: 3_600_000, idleMs: 0, keyCount: 1, mouseCount: 1, sessions: 1 },
];

const LABEL = 'Download September 2026 as CSV';

describe('ReportDownloadButton', () => {
  it('stays shut while the month is still loading', async () => {
    await render(
      <ReportDownloadButton days={DAYS} loading monthKey="2026-09" monthLabel="September 2026" />,
    );
    expect(button(LABEL).disabled).toBe(true);
  });

  it('spins while the file is written, then says where it went', async () => {
    const saved = deferred<SavedReport>();
    stubTracker({ saveReport: () => saved.promise });
    await render(
      <ReportDownloadButton
        days={DAYS}
        loading={false}
        monthKey="2026-09"
        monthLabel="September 2026"
      />,
    );
    await click(button(LABEL));
    expect(button(LABEL).className).toContain('MuiButton-loading');
    saved.resolve({ path: '/tmp/report.csv' });
    await flush();
    expect(button(LABEL).className).not.toContain('MuiButton-loading');
    expect(document.body.textContent).toContain('Saved to /tmp/report.csv');
  });

  it('says nothing for a cancelled dialog, and says so when the save fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const saveReport = vi
      .fn()
      .mockResolvedValueOnce({ path: null })
      .mockRejectedValueOnce(new Error('EACCES'));
    stubTracker({ saveReport });
    await render(
      <ReportDownloadButton
        days={DAYS}
        loading={false}
        monthKey="2026-09"
        monthLabel="September 2026"
      />,
    );
    await click(button(LABEL));
    expect(document.body.textContent).not.toContain('Saved to');
    await click(button(LABEL));
    expect(document.body.textContent).toContain('Could not save the report.');
  });
});

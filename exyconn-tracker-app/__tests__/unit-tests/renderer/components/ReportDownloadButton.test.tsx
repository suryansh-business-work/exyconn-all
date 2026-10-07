// @vitest-environment jsdom
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReportDay } from '@shared/types';
import ReportDownloadButton from '../../../../src/renderer/components/ReportDownloadButton';
import { button, clickElement, render, stubTracker, unmountAll } from '../../test-utils';
import { pageText } from './fixtures';

afterEach(unmountAll);

const DAYS: ReportDay[] = [
  { date: '2026-09-14', activeMs: 3_600_000, idleMs: 0, keyCount: 1, mouseCount: 1, sessions: 1 },
];
const LABEL = 'Download September 2026 as CSV';

function mountButton(days: ReportDay[]) {
  return render(
    <ReportDownloadButton
      days={days}
      loading={false}
      monthKey="2026-09"
      monthLabel="September 2026"
    />,
  );
}

describe('ReportDownloadButton', () => {
  it('will not write a file for an empty month', async () => {
    await mountButton([]);
    expect(button(LABEL).disabled).toBe(true);
  });

  it('writes the month as CSV, and the notice can be dismissed', async () => {
    const saveReport = vi.fn(() => Promise.resolve({ path: '/reports/2026-09.csv' }));
    stubTracker({ saveReport });
    await mountButton(DAYS);
    await clickElement(button(LABEL));
    expect(saveReport).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: 'tracker-report-2026-09.csv',
        content: expect.stringContaining('2026-09-14,1.00,0.00,100,1,1,1'),
      }),
    );
    expect(pageText()).toContain('Saved to /reports/2026-09.csv');

    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    // Let the snackbar's exit transition finish.
    await act(() => new Promise<void>((resolve) => setTimeout(resolve, 500)));
    expect(pageText()).not.toContain('Saved to');
  });
});

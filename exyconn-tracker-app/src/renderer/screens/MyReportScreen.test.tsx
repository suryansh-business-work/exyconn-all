// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { DayDetail, ReportDay } from '@shared/types';
import MyReportScreen from './MyReportScreen';
import { installDomShims } from '../a11y/render-harness';
import { click, deferred, flush, render, stubTracker, unmountAll } from '../a11y/component-harness';

beforeAll(installDomShims);
afterEach(() => {
  unmountAll();
  vi.restoreAllMocks();
});

describe('MyReportScreen', () => {
  it('holds the month’s totals and charts as skeletons until the month arrives', async () => {
    const month = deferred<ReportDay[]>();
    stubTracker({
      getReport: () => month.promise,
      getDay: () => new Promise<DayDetail>(() => undefined),
    });
    await render(<MyReportScreen timezone="UTC" />);
    const days = document.querySelector<HTMLElement>('[role="tab"]:nth-child(3)');
    if (days === null) {
      throw new Error('No Days tab');
    }
    await click(days);
    expect(document.body.textContent).not.toContain('Total worked');
    expect(document.body.textContent).not.toContain('Hours this month');
    expect(document.body.textContent).not.toContain('No tracked time this month');

    month.resolve([]);
    await flush();
    expect(document.body.textContent).toContain('Total worked');
    expect(document.body.textContent).toContain('Hours this month');
    expect(document.body.textContent).toContain('No tracked time this month');
  });

  it('says when the month could not be read, and reads the day that is picked', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const getReport = vi.fn(() => Promise.reject(new Error('Offline')));
    const getDay = vi.fn(() => new Promise<DayDetail>(() => undefined));
    stubTracker({ getReport, getDay });
    await render(<MyReportScreen timezone="UTC" />);
    await flush();
    expect(document.body.textContent).toContain('Could not load your report.');

    const calendar = document.querySelector<HTMLElement>('[role="tab"]:nth-child(2)');
    if (calendar === null) {
      throw new Error('No Calendar tab');
    }
    await click(calendar);
    const first = [...document.querySelectorAll<HTMLElement>('[role="gridcell"]')].find(
      (cell) => cell.textContent === '1',
    );
    if (first === undefined) {
      throw new Error('No 1st');
    }
    const calls = getDay.mock.calls.length;
    await click(first);
    expect(getDay.mock.calls.length).toBe(calls + 1);
  });
});

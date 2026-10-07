// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DayDetail, ReportDay } from '@shared/types';
import MyReportScreen from '../../../../src/renderer/screens/MyReportScreen';
import {
  clickElement,
  flush,
  installDomShims,
  render,
  stubTracker,
  unmountAll,
} from '../../test-utils';

// jsdom has no canvas, so Chart.js cannot build a chart and crashes when its data changes on a
// month switch; the chart's own drawing is not what is under test here.
vi.mock('react-chartjs-2', () => ({ Bar: () => null, Line: () => null }));

beforeAll(installDomShims);
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 14, 12));
});
afterEach(() => {
  unmountAll();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const DAYS: ReportDay[] = [
  { date: '2026-09-02', activeMs: 3_600_000, idleMs: 0, keyCount: 1, mouseCount: 1, sessions: 1 },
];

function tab(label: string): HTMLElement {
  const found = [...document.querySelectorAll<HTMLElement>('[role="tab"]')].find(
    (node) => node.textContent === label,
  );
  if (found === undefined) {
    throw new Error(`No tab "${label}"`);
  }
  return found;
}

function iconButton(label: string): HTMLButtonElement {
  const found = document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
  if (found === null) {
    throw new Error(`No button "${label}"`);
  }
  return found;
}

const getReport = vi.fn((_from: string, _to: string) => Promise.resolve(DAYS));

async function open(): Promise<void> {
  getReport.mockClear();
  stubTracker({ getReport, getDay: () => new Promise<DayDetail>(() => undefined) });
  await render(<MyReportScreen timezone="UTC" />);
  await flush();
}

describe('MyReportScreen views', () => {
  it('opens on the overview, which compares periods rather than months', async () => {
    await open();
    expect(tab('Overview').getAttribute('aria-selected')).toBe('true');
    const panel = document.querySelector('[role="tabpanel"]');
    expect(panel?.getAttribute('aria-labelledby')).toBe(tab('Overview').id);
    expect(getReport).toHaveBeenCalledWith('2026-09-01T00:00:00.000Z', '2026-10-01T00:00:00.000Z');
  });

  it('walks back a month on the Days view, and forward again but never past this one', async () => {
    await open();
    await clickElement(tab('Days'));
    expect(iconButton('Next month').disabled).toBe(true);
    expect(document.body.textContent).toContain('Total worked');

    await clickElement(iconButton('Previous month'));
    await flush();
    expect(getReport).toHaveBeenCalledWith('2026-08-01T00:00:00.000Z', '2026-09-01T00:00:00.000Z');
    expect(iconButton('Next month').disabled).toBe(false);

    await clickElement(iconButton('Next month'));
    await flush();
    expect(iconButton('Next month').disabled).toBe(true);
  });
});

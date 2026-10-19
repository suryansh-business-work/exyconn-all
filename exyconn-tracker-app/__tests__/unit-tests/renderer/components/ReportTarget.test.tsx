// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { monthTarget } from '@exyconn/tracker-core';
import ReportTarget from '../../../../src/renderer/components/ReportTarget';
import { render, unmountAll } from '../../test-utils';

afterEach(unmountAll);

const HOUR = 3_600_000;

const CONTRACT = {
  workHoursPerDay: 8,
  days: [
    { date: '2026-02-02', expectedMs: 8 * HOUR, offReason: null, offLabel: null },
    { date: '2026-02-03', expectedMs: 0, offReason: 'LEAVE', offLabel: 'EL' },
    { date: '2026-02-04', expectedMs: 8 * HOUR, offReason: null, offLabel: null },
  ],
};

const figures = (): (string | null)[] =>
  [...document.querySelectorAll('p')].map((node) => node.textContent);

describe('ReportTarget', () => {
  it('lists expected, logged, the deficit in red and the leave taken', async () => {
    const target = monthTarget(
      CONTRACT,
      [{ date: '2026-02-02', activeMs: 5 * HOUR }],
      '2026-02-03',
    );
    await render(<ReportTarget target={target} workHoursPerDay={8} />);

    expect(figures()).toEqual(['16h 0m', '5h 0m', '-3h 0m', '1 days (-8h 0m)']);
    const deficit = [...document.querySelectorAll('p')][2];
    const logged = [...document.querySelectorAll('p')][1];
    expect(getComputedStyle(deficit).color).not.toBe(getComputedStyle(logged).color);
    expect(document.body.textContent).toContain(
      '8h a day on your work days, less holidays and approved leave. Ringed red days fell short.',
    );
  });

  it('shows a surplus with its plus sign, not in red', async () => {
    const target = monthTarget(
      CONTRACT,
      [{ date: '2026-02-02', activeMs: 9 * HOUR }],
      '2026-02-03',
    );
    await render(<ReportTarget target={target} workHoursPerDay={8} />);

    const [, logged, deficit] = [...document.querySelectorAll('p')];
    expect(deficit.textContent).toBe('+1h 0m');
    expect(getComputedStyle(deficit).color).toBe(getComputedStyle(logged).color);
  });
});

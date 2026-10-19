import { screen } from '@testing-library/react';
import { monthTarget } from '@exyconn/tracker-core';
import { describe, expect, it } from 'vitest';
import { ReportTarget } from '../../../../src/components/report/ReportTarget';
import { renderWithProviders } from '../../test-utils';
import { queryByA11yLabel } from '../state';

const HOUR = 3_600_000;

const CONTRACT = {
  workHoursPerDay: 8,
  days: [
    { date: '2026-02-02', expectedMs: 8 * HOUR, offReason: null, offLabel: null },
    { date: '2026-02-03', expectedMs: 0, offReason: 'LEAVE', offLabel: 'EL' },
    { date: '2026-02-04', expectedMs: 8 * HOUR, offReason: null, offLabel: null },
  ],
};

describe('ReportTarget', () => {
  it('reads each figure as one labelled line, the deficit included', () => {
    const target = monthTarget(
      CONTRACT,
      [{ date: '2026-02-02', activeMs: 5 * HOUR }],
      '2026-02-03',
    );
    renderWithProviders(<ReportTarget target={target} workHoursPerDay={8} />);

    expect(queryByA11yLabel('Expected this month: 16h 0m')).not.toBeNull();
    expect(queryByA11yLabel('Logged this month: 5h 0m')).not.toBeNull();
    expect(queryByA11yLabel('Deficit so far: -3h 0m')).not.toBeNull();
    expect(queryByA11yLabel('Leave this month: 1 days (-8h 0m)')).not.toBeNull();
    expect(
      screen.getByText(
        '8h a day on your work days, less holidays and approved leave. Ringed red days fell short.',
      ),
    ).toBeInTheDocument();
  });

  it('shows a surplus with its plus sign when the employee is ahead', () => {
    const target = monthTarget(
      CONTRACT,
      [{ date: '2026-02-02', activeMs: 9 * HOUR }],
      '2026-02-03',
    );
    renderWithProviders(<ReportTarget target={target} workHoursPerDay={7.5} />);

    expect(screen.getByText('+1h 0m')).toBeInTheDocument();
    expect(screen.getByText(/^7\.5h a day/)).toBeInTheDocument();
  });
});

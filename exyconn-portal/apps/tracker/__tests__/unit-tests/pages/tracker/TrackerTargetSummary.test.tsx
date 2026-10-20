import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { monthTarget } from '@exyconn/tracker-core';
import { TrackerTargetSummary } from '../../../../src/pages/tracker/TrackerTargetSummary';
import { renderWithProviders } from '../../test-utils';

const HOUR = 3_600_000;

/** Two working days already over, one of them on leave, 6h logged on the other. */
const TARGET = monthTarget(
  {
    workHoursPerDay: 8,
    days: [
      { date: '2026-01-05', expectedMs: 8 * HOUR, offReason: null },
      { date: '2026-01-06', expectedMs: 0, offReason: 'LEAVE', offLabel: 'CL' },
      { date: '2026-01-07', expectedMs: 8 * HOUR, offReason: null },
    ],
  },
  [{ date: '2026-01-05', activeMs: 6 * HOUR }],
  '2026-01-07',
);

type Props = Parameters<typeof TrackerTargetSummary>[0];

function renderSummary(overrides: Partial<Props> = {}) {
  const onDownload = vi.fn();
  renderWithProviders(
    <TrackerTargetSummary
      target={TARGET}
      workHoursPerDay={8}
      workDays={[1, 2, 3, 4, 5]}
      loading={false}
      error={undefined}
      downloading={false}
      onDownload={onDownload}
      {...overrides}
    />,
  );
  return onDownload;
}

describe('TrackerTargetSummary', () => {
  it('shows expected, logged, the deficit so far and the leave taken', () => {
    renderSummary();
    expect(screen.getByText('Expected this month')).toBeInTheDocument();
    expect(screen.getByText('16h 0m')).toBeInTheDocument();
    expect(screen.getByText('6h 0m')).toBeInTheDocument();
    expect(screen.getByText('-2h 0m')).toBeInTheDocument();
    expect(screen.getByText('1 days (-8h 0m)')).toBeInTheDocument();
  });

  it('explains the expected hours with the employee own working week', () => {
    renderSummary();
    expect(
      screen.getByText(/^8h a day on Mon, Tue, Wed, Thu,? and Fri, less holidays/),
    ).toBeInTheDocument();
  });

  it('names a week that is not Monday to Friday', () => {
    renderSummary({ workHoursPerDay: 9, workDays: [0, 1, 2, 3, 4] });
    expect(screen.getByText(/^9h a day on Mon, Tue, Wed, Thu,? and Sun,/)).toBeInTheDocument();
  });

  it('leaves the hint out until both the day length and the week are known', () => {
    renderSummary({ workDays: null });
    expect(screen.queryByText(/a day on/)).toBeNull();
  });

  it('shows zeros before the contract has loaded', () => {
    renderSummary({ target: null, workHoursPerDay: null, workDays: null });
    expect(screen.getAllByText('0m').length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText('0 days (-0m)')).toBeInTheDocument();
  });

  it('downloads the month report on a click', async () => {
    const onDownload = renderSummary();
    await userEvent.click(screen.getByRole('button', { name: 'Download report (XLSX)' }));
    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it('disables the download while the month is loading', () => {
    renderSummary({ loading: true });
    expect(screen.getByRole('button', { name: 'Download report (XLSX)' })).toBeDisabled();
  });

  it('says the expected hours could not be loaded instead of showing figures', () => {
    renderSummary({ error: new Error('boom') });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Could not load the expected hours for this month.',
    );
    expect(screen.queryByText('Expected this month')).toBeNull();
  });
});

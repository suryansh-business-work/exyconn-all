import { fireEvent, screen } from '@testing-library/react';
import { formatDayLabel } from '@exyconn/tracker-core';
import { describe, expect, it, vi } from 'vitest';
import { ReportCalendar } from '../../../../src/components/report/ReportCalendar';
import { renderWithProviders } from '../../test-utils';
import { HOUR, reportDay } from './fixtures';

const JANUARY = new Date(2026, 0, 1);
const SELECTED = new Date(2026, 0, 12);
const TODAY = new Date(2026, 1, 17);
const HINT =
  'Dotted days have tracked time, coloured by how active they were. Tap one to see its screenshots.';

function renderCalendar(loading: boolean) {
  const onSelect = vi.fn();
  const onMonthChange = vi.fn();
  renderWithProviders(
    <ReportCalendar
      days={[reportDay('2026-01-07', 7 * HOUR, HOUR), reportDay('2026-01-08', 0, 0)]}
      loading={loading}
      month={JANUARY}
      selected={SELECTED}
      maxDate={TODAY}
      onSelect={onSelect}
      onMonthChange={onMonthChange}
    />,
  );
  return { onSelect, onMonthChange };
}

describe('ReportCalendar', () => {
  it('dots only the days with tracked time, by how active they were', () => {
    renderCalendar(false);

    expect(
      screen.getByRole('button', {
        name: `${formatDayLabel(new Date(2026, 0, 7))}, has tracked time, high activity`,
      }),
    ).toBeInTheDocument();
    // A day the portal returned with nothing on it is not a tracked day.
    expect(
      screen.getByRole('button', { name: formatDayLabel(new Date(2026, 0, 8)) }),
    ).toBeInTheDocument();
    expect(screen.getByText(HINT)).toBeInTheDocument();
  });

  it('says the dots are still coming while the month loads', () => {
    renderCalendar(true);

    expect(screen.getByText('Loading your tracked days…')).toBeInTheDocument();
    expect(screen.queryByText(HINT)).not.toBeInTheDocument();
  });

  it('selects a tapped day and pages months from the switcher', () => {
    const { onSelect, onMonthChange } = renderCalendar(false);

    fireEvent.click(screen.getByRole('button', { name: formatDayLabel(new Date(2026, 0, 20)) }));
    expect(onSelect).toHaveBeenCalledWith(new Date(2026, 0, 20));

    // January is before today's month, so the next one can be opened.
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(onMonthChange).toHaveBeenCalledWith(new Date(2026, 1, 1));
  });

  it('offers the jump-to-date picker for the selected day', () => {
    renderCalendar(false);

    expect(
      screen.getByRole('button', { name: `Jump to date: ${formatDayLabel(SELECTED)}` }),
    ).toBeInTheDocument();
  });
});

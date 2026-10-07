import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrackerCalendar } from '@/pages/tracker-view/TrackerCalendar';
import { buildTrackerMonth } from '@/pages/tracker-view/buildTrackerMonth';
import { renderWithProviders } from '../../test-utils';
import { HOUR_MS, makeBucket } from './fixtures';

// March 2026: Sunday the 1st to Tuesday the 31st, padded to Saturday 4 April.
const days = buildTrackerMonth(
  new Date(2026, 2, 1),
  [makeBucket({ date: '2026-03-02', activeMs: 3 * HOUR_MS, idleMs: HOUR_MS })],
  new Date(2026, 2, 5),
);

function renderCalendar(selectedDate: string | null = null) {
  const onSelectDay = vi.fn();
  renderWithProviders(
    <TrackerCalendar days={days} selectedDate={selectedDate} onSelectDay={onSelectDay} />,
  );
  return onSelectDay;
}

/**
 * The day cells are buttons; the weekday header is plain text in front of them. Read straight
 * from the DOM: a role query over 35 MUI buttons is slow enough to time out a loaded machine.
 */
const dayButtons = () => [...document.querySelectorAll('button')];

describe('TrackerCalendar', () => {
  it('heads the grid with the week, Sunday first, and renders a cell per day', () => {
    renderCalendar();

    for (const label of ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(dayButtons()).toHaveLength(35);
  });

  it("shows a tracked day's worked time and activity, and nothing on an empty day", () => {
    renderCalendar();

    const second = dayButtons()[1];
    expect(within(second).getByText('2')).toBeInTheDocument();
    expect(within(second).getByText('3h 0m')).toBeInTheDocument();
    expect(within(second).getByText('75% active')).toBeInTheDocument();
    expect(dayButtons()[2]).toHaveTextContent(/^3$/);
  });

  it('bolds today', () => {
    renderCalendar();

    expect(within(dayButtons()[4]).getByText('5')).toHaveStyle({ fontWeight: 700 });
    expect(within(dayButtons()[5]).getByText('6')).not.toHaveStyle({ fontWeight: 700 });
  });

  it('selects a day in the month by its date key', async () => {
    const onSelectDay = renderCalendar();

    await userEvent.click(dayButtons()[9]);

    expect(onSelectDay).toHaveBeenCalledWith('2026-03-10');
  });

  it('disables the days that belong to the next month', () => {
    renderCalendar('2026-03-10');

    const april = dayButtons().slice(31);
    expect(april).toHaveLength(4);
    for (const cell of april) {
      expect(cell).toBeDisabled();
    }
    expect(dayButtons()[9]).toBeEnabled();
  });

  it('outlines the selected day differently from the rest', () => {
    renderCalendar('2026-03-10');

    const border = (cell: HTMLElement) =>
      getComputedStyle(cell.firstElementChild as Element).borderColor;
    expect(border(dayButtons()[9])).not.toBe(border(dayButtons()[8]));
    expect(border(dayButtons()[8])).toBe(border(dayButtons()[10]));
  });
});

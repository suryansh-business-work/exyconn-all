import { fireEvent, screen } from '@testing-library/react';
import { formatDayLabel } from '@exyconn/tracker-core';
import { describe, expect, it, vi } from 'vitest';
import { CalendarDay } from '../../../../src/components/report/CalendarDay';
import { CalendarGrid } from '../../../../src/components/report/CalendarGrid';
import { buildMonthGrid, type CalendarCell } from '../../../../src/lib/report/calendar';
import { renderWithProviders } from '../../test-utils';

vi.mock('../../../../src/lib/report/calendar', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../src/lib/report/calendar')>();
  return { ...actual, buildMonthGrid: vi.fn(actual.buildMonthGrid) };
});

const FEB_3 = new Date(2026, 1, 3);

function cell(overrides: Partial<CalendarCell> = {}): CalendarCell {
  return {
    key: '2026-02-03',
    date: FEB_3,
    dayOfMonth: 3,
    inMonth: true,
    tracked: false,
    level: null,
    selected: false,
    today: false,
    disabled: false,
    ...overrides,
  };
}

describe('CalendarDay', () => {
  it('names the day, that it is today, and how active it was', () => {
    const onSelect = vi.fn();
    renderWithProviders(
      <CalendarDay
        cell={cell({ today: true, tracked: true, level: 'high' })}
        onSelect={onSelect}
      />,
    );

    const day = screen.getByRole('button', {
      name: `${formatDayLabel(FEB_3)}, today, has tracked time, high activity`,
    });
    expect(day).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByText('3')).toBeInTheDocument();

    fireEvent.click(day);
    expect(onSelect).toHaveBeenCalledWith(FEB_3);
  });

  it('marks the selected day for a screen reader, with nothing else to say', () => {
    renderWithProviders(<CalendarDay cell={cell({ selected: true })} onSelect={vi.fn()} />);

    expect(screen.getByRole('button', { name: formatDayLabel(FEB_3) })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('cannot pick a day after today', () => {
    const onSelect = vi.fn();
    renderWithProviders(<CalendarDay cell={cell({ disabled: true })} onSelect={onSelect} />);

    const day = screen.getByRole('button', { name: formatDayLabel(FEB_3) });
    expect(day).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(day);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('leaves a neighbouring month’s day blank and untappable', () => {
    renderWithProviders(<CalendarDay cell={cell({ inMonth: false })} onSelect={vi.fn()} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByText('3')).not.toBeInTheDocument();
  });
});

describe('CalendarGrid', () => {
  // January 2026 starts on a Thursday, so its first week carries four December days.
  const JANUARY = new Date(2026, 0, 1);
  const TODAY = new Date(2026, 0, 15);

  function renderJanuary(onSelect = vi.fn()) {
    renderWithProviders(
      <CalendarGrid
        month={JANUARY}
        tracked={new Map([['2026-01-05', 'medium']])}
        selected={TODAY}
        maxDate={TODAY}
        onSelect={onSelect}
      />,
    );
    return onSelect;
  }

  it('heads the weeks with the weekday names, Sunday first', () => {
    renderJanuary();

    for (const weekday of ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']) {
      expect(screen.getByText(weekday)).toBeInTheDocument();
    }
  });

  it('offers one tappable cell per day of the month and leaves the padding blank', () => {
    renderJanuary();

    expect(screen.getAllByRole('button')).toHaveLength(31);
  });

  it('dots tracked days, rings today and locks the days after it', () => {
    const onSelect = renderJanuary();

    const tracked = new Date(2026, 0, 5);
    expect(
      screen.getByRole('button', {
        name: `${formatDayLabel(tracked)}, has tracked time, medium activity`,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: `${formatDayLabel(TODAY)}, today` })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    const future = screen.getByRole('button', { name: formatDayLabel(new Date(2026, 0, 20)) });
    expect(future).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(future);
    expect(onSelect).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: formatDayLabel(new Date(2026, 0, 2)) }));
    expect(onSelect).toHaveBeenCalledWith(new Date(2026, 0, 2));
  });

  it('draws no headers and no days when the grid has no weeks', () => {
    vi.mocked(buildMonthGrid).mockReturnValue([]);
    renderJanuary();

    expect(screen.queryByText('Sun')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrackerView } from '@/pages/tracker-view/TrackerView';
import { buildTrackerMonth } from '@/pages/tracker-view/buildTrackerMonth';
import type { TrackerDayMark } from '@/pages/tracker-view/tracker.types';
import { renderWithProviders } from '../../test-utils';
import { HOUR_MS, echoFormat, makeBucket, makeDay } from './fixtures';

vi.mock('react-chartjs-2', () => ({ Bar: () => <output data-testid="bar" /> }));

type ViewProps = ComponentProps<typeof TrackerView>;

const buckets = [
  makeBucket({ date: '2026-02-03', activeMs: HOUR_MS }),
  makeBucket({ date: '2026-02-04', activeMs: HOUR_MS, manualMs: 2 * HOUR_MS }),
];

function renderView(patch: Partial<ViewProps> = {}) {
  const props: ViewProps = {
    monthLabel: 'February 2026',
    onPrev: vi.fn(),
    onNext: vi.fn(),
    loading: false,
    days: buildTrackerMonth(new Date(2026, 1, 1), buckets, new Date(2026, 1, 3)),
    buckets,
    selectedDate: null,
    onSelectDay: vi.fn(),
    day: undefined,
    dayLoading: false,
    dayLabel: 'Tuesday, 3 February',
    timezone: 'UTC',
    formatTime: echoFormat,
    formatDateTime: echoFormat,
    ...patch,
  };
  renderWithProviders(<TrackerView {...props} />);
  return props;
}

describe('TrackerView', () => {
  it('asks for an employee instead of a calendar when there is nobody to show', () => {
    renderView({ empty: true });

    expect(screen.getByText('Select an employee to view their tracker.')).toBeInTheDocument();
    expect(screen.queryByText('February 2026')).not.toBeInTheDocument();
  });

  it('composes the month header, calendar, month chart and day panel', async () => {
    const props = renderView();

    expect(screen.getByText('February 2026').tagName).toBe('H6');
    expect(screen.queryByLabelText('Loading calendar')).not.toBeInTheDocument();
    expect(screen.getByText('Hours this month')).toBeInTheDocument();
    const legend = screen.getByRole('list', { name: 'Calendar legend' });
    expect(within(legend).getAllByRole('listitem')).toHaveLength(6);
    // The legend explains the calendar, so it sits above it.
    expect(
      legend.compareDocumentPosition(screen.getByText('Sun')) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByText('Select a day to see the breakdown.')).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText('Previous month'));
    await userEvent.click(screen.getByLabelText('Next month'));
    expect(props.onPrev).toHaveBeenCalledTimes(1);
    expect(props.onNext).toHaveBeenCalledTimes(1);

    const tracked = screen.getByText('1h 0m').closest('button');
    expect(tracked).not.toBeNull();
    await userEvent.click(tracked as HTMLButtonElement);
    expect(props.onSelectDay).toHaveBeenCalledWith('2026-02-03');
  });

  it('shows the calendar spinner while loading and the selected day in the panel', () => {
    renderView({ loading: true, selectedDate: '2026-02-03', day: makeDay() });

    expect(screen.getByLabelText('Loading calendar')).toBeInTheDocument();
    expect(screen.getByText('Tuesday, 3 February').tagName).toBe('H6');
  });

  it("hands the panel the selected day's status and its off-computer work", () => {
    renderView({
      selectedDate: '2026-02-04',
      day: makeDay(),
      dayLabel: 'Wednesday, 4 February',
      dayMarks: new Map<string, TrackerDayMark>([['2026-02-04', 'OFF_COMPUTER']]),
    });

    const heading = screen.getByRole('heading', { name: 'Wednesday, 4 February' });
    expect(heading.parentElement).toHaveTextContent('Off Computer Work');
    // The legend, the day's tile, the panel's chip and the panel's metric.
    expect(screen.getAllByText('Off Computer Work')).toHaveLength(4);
    expect(screen.getByText('2h 0m')).toBeInTheDocument();
  });

  it('shows no status or off-computer work for a selected day without either', () => {
    renderView({ selectedDate: '2026-02-10', day: makeDay(), dayLabel: 'Tuesday, 10 February' });

    const heading = screen.getByRole('heading', { name: 'Tuesday, 10 February' });
    expect(heading.parentElement).toHaveTextContent(/^Tuesday, 10 February$/);
    // Only the legend's entry: no chip and no metric.
    expect(screen.getAllByText('Off Computer Work')).toHaveLength(1);
  });
});

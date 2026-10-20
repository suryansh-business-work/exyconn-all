import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MyReportScreen } from '../../../../src/components/report/MyReportScreen';
import type { DayQuery } from '../../../../src/hooks/useMyDay';
import type { ReportQuery } from '../../../../src/hooks/useMyReport';
import { renderWithProviders } from '../../test-utils';
import { HOUR, insights, reportDay } from './fixtures';

const hooks = vi.hoisted(() => ({ report: vi.fn(), day: vi.fn(), insights: vi.fn() }));

vi.mock('../../../../src/hooks/useMyReport', () => ({ useMyReport: hooks.report }));
vi.mock('../../../../src/hooks/useMyDay', () => ({ useMyDay: hooks.day }));
vi.mock('../../../../src/hooks/usePeriodInsights', () => ({ usePeriodInsights: hooks.insights }));
vi.mock('../../../../src/components/report/overview/ReportOverview', async () => ({
  ReportOverview: (await import('./my-report-stubs')).OverviewStub,
}));
vi.mock('../../../../src/components/report/ReportCalendar', async () => ({
  ReportCalendar: (await import('./my-report-stubs')).CalendarStub,
}));
vi.mock('../../../../src/components/report/DayDetailPanel', async () => ({
  DayDetailPanel: (await import('./my-report-stubs')).DayPanelStub,
}));
vi.mock('../../../../src/components/report/MonthSwitcher', async () => ({
  MonthSwitcher: (await import('./my-report-stubs')).MonthStub,
}));
vi.mock('../../../../src/components/report/ReportTotals', () => ({
  ReportTotals: () => <div data-testid="totals" />,
}));
vi.mock('../../../../src/components/report/ReportMonthChart', () => ({
  ReportMonthChart: ({ monthLabel }: Readonly<{ monthLabel: string }>) => (
    <div data-testid="hours-chart">{monthLabel}</div>
  ),
}));
vi.mock('../../../../src/components/report/ReportActivityChart', () => ({
  ReportActivityChart: ({ monthLabel }: Readonly<{ monthLabel: string }>) => (
    <div data-testid="activity-chart">{monthLabel}</div>
  ),
}));
vi.mock('../../../../src/components/report/ReportTable', () => ({
  ReportTable: ({ loading }: Readonly<{ loading: boolean }>) => (
    <div data-testid="table">{loading ? 'table loading' : 'table ready'}</div>
  ),
}));
vi.mock('../../../../src/components/report/ReportDownloadButton', () => ({
  ReportDownloadButton: ({
    monthKey,
    monthLabel,
  }: Readonly<{ monthKey: string; monthLabel: string }>) => (
    <div data-testid="download">{`${monthKey} ${monthLabel}`}</div>
  ),
}));

const ZONE = 'Asia/Kolkata';
const TODAY = new Date(2026, 1, 17, 10);
const reload = { report: vi.fn(), day: vi.fn(), insights: vi.fn() };

function report(overrides: Partial<ReportQuery> = {}): ReportQuery {
  return {
    days: [reportDay('2026-02-03', 6 * HOUR, 2 * HOUR)],
    contract: null,
    totals: { activeMs: 6 * HOUR, idleMs: 2 * HOUR, activityPercent: 75 },
    loading: false,
    refreshing: false,
    error: null,
    reload: reload.report,
    ...overrides,
  };
}

function day(overrides: Partial<DayQuery> = {}): DayQuery {
  return {
    detail: null,
    loading: false,
    refreshing: false,
    error: null,
    reload: reload.day,
    ...overrides,
  };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(TODAY);
  hooks.report.mockReturnValue(report());
  hooks.day.mockReturnValue(day());
  hooks.insights.mockReturnValue(insights({ reload: reload.insights }));
});

function openTab(name: string): void {
  fireEvent.click(screen.getByRole('tab', { name }));
}

describe('MyReportScreen', () => {
  it('opens on the last 7 days, reading today’s month and day in the employee’s zone', () => {
    renderWithProviders(<MyReportScreen timezone={ZONE} />);

    expect(
      screen.getByText('This is your own tracked time, as your workspace sees it.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Overview of 7 days')).toBeInTheDocument();
    expect(hooks.insights).toHaveBeenLastCalledWith(7, ZONE);
    expect(hooks.report).toHaveBeenLastCalledWith(new Date(2026, 1, 1), ZONE);
    expect(hooks.day).toHaveBeenLastCalledWith(TODAY, ZONE);
  });

  it('switches the overview to the last 30 days', () => {
    renderWithProviders(<MyReportScreen timezone={ZONE} />);

    fireEvent.click(screen.getByText('Overview of 7 days'));

    expect(screen.getByText('Overview of 30 days')).toBeInTheDocument();
    expect(hooks.insights).toHaveBeenLastCalledWith(30, ZONE);
  });

  it('says when the month could not be loaded', () => {
    hooks.report.mockReturnValue(report({ error: 'The report could not be loaded.' }));
    renderWithProviders(<MyReportScreen timezone={ZONE} />);

    expect(screen.getByText('The report could not be loaded.')).toBeInTheDocument();
  });

  it('moves the calendar to the month of a picked day and shows that day', () => {
    renderWithProviders(<MyReportScreen timezone={ZONE} />);
    openTab('Calendar');

    expect(screen.queryByText('Overview of 7 days')).not.toBeInTheDocument();
    expect(screen.getByTestId('day-panel')).toHaveTextContent(TODAY.toDateString());

    fireEvent.click(screen.getByText('Pick Christmas'));
    const christmas = new Date(2025, 11, 25);
    expect(screen.getByTestId('day-panel')).toHaveTextContent(christmas.toDateString());
    expect(hooks.report).toHaveBeenLastCalledWith(new Date(2025, 11, 1), ZONE);
    expect(hooks.day).toHaveBeenLastCalledWith(christmas, ZONE);

    fireEvent.click(screen.getByText('Show November'));
    expect(hooks.report).toHaveBeenLastCalledWith(new Date(2025, 10, 1), ZONE);
  });

  it('keeps the month’s charts back while the month loads, never a month of zeros', () => {
    hooks.report.mockReturnValue(report({ loading: true }));
    renderWithProviders(<MyReportScreen timezone={ZONE} />);
    openTab('Days');

    expect(screen.getByTestId('month')).toHaveTextContent('February 2026, latest');
    expect(screen.queryByTestId('totals')).not.toBeInTheDocument();
    expect(screen.queryByTestId('hours-chart')).not.toBeInTheDocument();
    expect(screen.getByTestId('table')).toHaveTextContent('table loading');
    expect(screen.getByTestId('download')).toHaveTextContent('2026-02 February 2026');
  });

  it('shows the totals, both charts, the table and the download for the month on show', () => {
    renderWithProviders(<MyReportScreen timezone={ZONE} />);
    openTab('Days');

    expect(screen.getByTestId('totals')).toBeInTheDocument();
    expect(screen.getByTestId('hours-chart')).toHaveTextContent('February 2026');
    expect(screen.getByTestId('activity-chart')).toHaveTextContent('February 2026');
    expect(screen.getByTestId('table')).toHaveTextContent('table ready');

    fireEvent.click(screen.getByText('Show January'));
    expect(screen.getByTestId('month')).toHaveTextContent('January 2026, can go forward');
    expect(screen.getByTestId('download')).toHaveTextContent('2026-01 January 2026');
  });

  it('rings the calendar and sums the month against the contract once it arrives', () => {
    hooks.report.mockReturnValue(
      report({
        contract: {
          workHoursPerDay: 8,
          days: [
            { date: '2026-02-02', expectedMs: 8 * HOUR, offReason: null, offLabel: null },
            { date: '2026-02-03', expectedMs: 8 * HOUR, offReason: null, offLabel: null },
            { date: '2026-02-04', expectedMs: 0, offReason: 'LEAVE', offLabel: 'CL' },
            { date: '2026-02-07', expectedMs: 0, offReason: 'WEEKEND', offLabel: null },
          ],
        },
      }),
    );
    renderWithProviders(<MyReportScreen timezone={ZONE} />);
    openTab('Calendar');
    // The 2nd had nothing tracked and the 3rd fell 2h short of its 8h — both are finished.
    expect(JSON.parse(screen.getByTestId('calendar-marks').textContent ?? '')).toEqual({
      '2026-02-02': 'SHORT',
      '2026-02-03': 'SHORT',
      '2026-02-04': 'LEAVE',
      '2026-02-07': 'WEEK_OFF',
    });
    expect(JSON.parse(screen.getByTestId('calendar-labels').textContent ?? '')).toEqual({
      '2026-02-04': 'CL',
    });

    openTab('Days');
    expect(screen.getByText('Expected this month')).toBeInTheDocument();
    expect(screen.getByText('16h 0m')).toBeInTheDocument();
    expect(screen.getByText('6h 0m')).toBeInTheDocument();
    expect(screen.getByText('-10h 0m')).toBeInTheDocument();
    expect(screen.getByText('1 days (-8h 0m)')).toBeInTheDocument();
  });

  it('leaves the calendar unringed and the target out until the contract arrives', () => {
    renderWithProviders(<MyReportScreen timezone={ZONE} />);
    openTab('Calendar');
    expect(screen.getByTestId('calendar-marks')).toHaveTextContent('{}');
    expect(screen.getByTestId('calendar-labels')).toHaveTextContent('{}');

    openTab('Days');
    expect(screen.queryByText('Expected this month')).toBeNull();
  });

  it('reloads the month, the day and the period on pull-to-refresh', () => {
    renderWithProviders(<MyReportScreen timezone={ZONE} />);

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));

    expect(reload.report).toHaveBeenCalledTimes(1);
    expect(reload.day).toHaveBeenCalledTimes(1);
    expect(reload.insights).toHaveBeenCalledTimes(1);
  });

  it.each(['report', 'day', 'insights'] as const)(
    'shows the refresh spinner while the %s is re-reading',
    (which) => {
      hooks.report.mockReturnValue(report({ refreshing: which === 'report' }));
      hooks.day.mockReturnValue(day({ refreshing: which === 'day' }));
      hooks.insights.mockReturnValue(
        insights({ refreshing: which === 'insights', reload: reload.insights }),
      );
      renderWithProviders(<MyReportScreen timezone={ZONE} />);

      expect(screen.getByRole('button', { name: 'Refresh' })).toHaveAttribute('aria-busy', 'true');
    },
  );

  it('shows no refresh spinner when nothing is re-reading', () => {
    renderWithProviders(<MyReportScreen timezone={ZONE} />);

    expect(screen.getByRole('button', { name: 'Refresh' })).toHaveAttribute('aria-busy', 'false');
  });
});

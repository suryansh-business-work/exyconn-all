import { fireEvent, screen } from '@testing-library/react';
import {
  formatCount,
  formatDayLabel,
  periodColumns,
  type PeriodLength,
} from '@exyconn/tracker-core';
import { describe, expect, it, vi } from 'vitest';
import { ReportOverview } from '../../../../../src/components/report/overview/ReportOverview';
import type { PeriodInsights } from '../../../../../src/hooks/usePeriodInsights';
import { renderWithProviders } from '../../../test-utils';
import { getByA11yLabel, queryByA11yLabel } from '../../state';
import { HOUR, WEEK_WINDOW, insights, reportDay } from '../fixtures';

const COLUMNS = periodColumns(
  [reportDay('2026-02-11', 6 * HOUR, 2 * HOUR), reportDay('2026-02-14', 3 * HOUR, HOUR)],
  WEEK_WINDOW.current,
);
const SUMMARY = 'Hours worked per day, last 7 days; 5 days tracked.';

function renderOverview(
  length: PeriodLength,
  data: PeriodInsights = insights({ columns: COLUMNS }),
) {
  const onLengthChange = vi.fn();
  renderWithProviders(
    <ReportOverview length={length} onLengthChange={onLengthChange} insights={data} />,
  );
  return onLengthChange;
}

describe('ReportOverview', () => {
  it('offers the 7- and 30-day periods, with the one on show checked', () => {
    const onLengthChange = renderOverview(7);

    expect(screen.getByRole('radio', { name: 'Last 7 days' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    const month = screen.getByRole('radio', { name: 'Last 30 days' });
    expect(month).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(month);
    expect(onLengthChange).toHaveBeenCalledWith(30);
  });

  it('shows the worked time against the period before', () => {
    renderOverview(7);

    expect(screen.getByText('Worked')).toBeInTheDocument();
    expect(screen.getByText('4h 0m the 7 days before.')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('draws one stripe per day, labelled at its first, middle and last day', () => {
    const { container } = renderWithProviders(
      <ReportOverview
        length={7}
        onLengthChange={vi.fn()}
        insights={insights({ columns: COLUMNS })}
      />,
    );

    const stripes = [...container.querySelectorAll('svg')].find(
      (svg) => svg.getAttribute('viewBox') === '0 0 1000 140',
    );
    expect(stripes?.querySelectorAll('rect')).toHaveLength(7);
    expect(getByA11yLabel(SUMMARY)).toBeInTheDocument();
    expect(screen.getByText(formatDayLabel('2026-02-11'))).toBeInTheDocument();
    expect(screen.getByText(formatDayLabel('2026-02-14'))).toBeInTheDocument();
    expect(screen.getByText(formatDayLabel('2026-02-17'))).toBeInTheDocument();
  });

  it('counts keystrokes, clicks, sessions and days, each against the period before', () => {
    renderOverview(7);

    expect(screen.getByText('Keystrokes')).toBeInTheDocument();
    expect(screen.getByText(formatCount(4200))).toBeInTheDocument();
    expect(screen.getByText(`${formatCount(2100)} the 7 days before`)).toBeInTheDocument();
    expect(screen.getByText('+100%')).toBeInTheDocument();
    expect(screen.getByText('Mouse clicks')).toBeInTheDocument();
    expect(screen.getByText('Sessions')).toBeInTheDocument();
    expect(screen.getByText('Days tracked')).toBeInTheDocument();
    expect(screen.getByText('+25%')).toBeInTheDocument();
  });

  it('words everything for the 30-day period when that is on show', () => {
    renderOverview(30);

    expect(screen.getByRole('radio', { name: 'Last 30 days' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByText('4h 0m the 30 days before.')).toBeInTheDocument();
    expect(
      getByA11yLabel('Hours worked per day, last 30 days; 5 days tracked.'),
    ).toBeInTheDocument();
  });

  it('falls back to the 7-day wording for a period it does not know', () => {
    renderOverview(14 as unknown as PeriodLength);

    expect(screen.getByText('4h 0m the 7 days before.')).toBeInTheDocument();
  });

  it('holds every card’s place while the period loads', () => {
    renderOverview(7, insights({ loading: true, range: { ...WEEK_WINDOW, current: [] } }));

    expect(screen.queryByText('Worked')).not.toBeInTheDocument();
    expect(screen.queryByText('Keystrokes')).not.toBeInTheDocument();
    expect(screen.queryByText('75%')).not.toBeInTheDocument();
    expect(queryByA11yLabel(SUMMARY)).toBeNull();
    expect(screen.getByText('Over time')).toBeInTheDocument();
  });

  it('says when the period could not be loaded', () => {
    renderOverview(7, insights({ error: 'The portal could not be reached.' }));

    expect(screen.getByText('The portal could not be reached.')).toBeInTheDocument();
  });
});

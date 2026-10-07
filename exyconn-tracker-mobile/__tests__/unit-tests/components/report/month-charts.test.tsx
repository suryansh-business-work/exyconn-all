import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ReportActivityChart } from '../../../../src/components/report/ReportActivityChart';
import { ReportMonthChart } from '../../../../src/components/report/ReportMonthChart';
import { brandColors } from '../../../../src/theme/brand';
import { useThemeColor } from '../../../../src/theme/useThemeColor';
import { renderHookWithProviders, renderWithProviders } from '../../test-utils';
import { getByA11yLabel } from '../state';
import { HOUR, reportDay } from './fixtures';

vi.mock('../../../../src/hooks/useMeasuredWidth', () => ({
  useMeasuredWidth: () => [320, () => undefined],
}));

const DAYS = [
  reportDay('2026-02-04', 4 * HOUR, 4 * HOUR),
  reportDay('2026-02-03', 6 * HOUR, 2 * HOUR),
];
const BRAND = brandColors(null, 'light');

describe('ReportMonthChart', () => {
  it('says what it plots and for which month', () => {
    renderWithProviders(<ReportMonthChart days={DAYS} monthLabel="February 2026" />);

    expect(screen.getByText('Hours this month')).toBeInTheDocument();
    expect(screen.getByText('February 2026 · each column is one day')).toBeInTheDocument();
    expect(
      getByA11yLabel(
        'Hours this month, February 2026: worked stacked under idle for each day. Switch to Table to hear every value.',
      ),
    ).toBeInTheDocument();
  });

  it('paints worked in the brand colour and idle in the muted ink', () => {
    const { result } = renderHookWithProviders(() => useThemeColor('muted'));
    const { container } = renderWithProviders(
      <ReportMonthChart days={DAYS} monthLabel="February 2026" />,
    );

    const fills = [...container.querySelectorAll('rect')].map((rect) => rect.getAttribute('fill'));
    expect(fills).toEqual([BRAND.primary, result.current, BRAND.primary, result.current]);
  });

  it('lists the days in date order, in hours, in its table', () => {
    renderWithProviders(<ReportMonthChart days={DAYS} monthLabel="February 2026" />);

    fireEvent.click(screen.getByRole('tab', { name: 'Show the numbers as a table' }));

    expect(getByA11yLabel('Day, Worked, Idle')).toBeInTheDocument();
    expect(getByA11yLabel('03, 6h, 2h')).toBeInTheDocument();
    expect(getByA11yLabel('04, 4h, 4h')).toBeInTheDocument();
  });

  it('translates the series names', () => {
    renderWithProviders(<ReportMonthChart days={DAYS} monthLabel="Februar 2026" />, {
      messages: { Worked: 'Gearbeitet' },
    });

    expect(screen.getByText('Gearbeitet')).toBeInTheDocument();
  });

  it('says so for a month with nothing tracked', () => {
    renderWithProviders(<ReportMonthChart days={[]} monthLabel="March 2026" />);

    expect(screen.getByText('No time tracked this month.')).toBeInTheDocument();
  });
});

describe('ReportActivityChart', () => {
  it('draws each day’s activity as a line in the brand’s second colour', () => {
    const { container } = renderWithProviders(
      <ReportActivityChart days={DAYS} monthLabel="February 2026" />,
    );

    expect(screen.getByText('Activity this month')).toBeInTheDocument();
    expect(
      screen.getByText('February 2026 · share of tracked time that was active'),
    ).toBeInTheDocument();
    const dots = [...container.querySelectorAll('circle')];
    expect(dots).toHaveLength(2);
    expect(dots[0]).toHaveAttribute('fill', BRAND.secondary);
  });

  it('reads every day as a percentage in its table', () => {
    renderWithProviders(<ReportActivityChart days={DAYS} monthLabel="February 2026" />);

    fireEvent.click(screen.getByRole('tab', { name: 'Show the numbers as a table' }));

    expect(getByA11yLabel('Day, Activity')).toBeInTheDocument();
    expect(getByA11yLabel('03, 75%')).toBeInTheDocument();
    expect(getByA11yLabel('04, 50%')).toBeInTheDocument();
  });

  it('is one sentence to a screen reader that points at the table', () => {
    renderWithProviders(<ReportActivityChart days={DAYS} monthLabel="February 2026" />);

    expect(
      getByA11yLabel(
        "Activity this month, February 2026: the share of each day's tracked time that was active. Switch to Table to hear every value.",
      ),
    ).toBeInTheDocument();
  });

  it('says so for a month with nothing tracked', () => {
    renderWithProviders(<ReportActivityChart days={[]} monthLabel="March 2026" />);

    expect(screen.getByText('No time tracked this month.')).toBeInTheDocument();
  });
});

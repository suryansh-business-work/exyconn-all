import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { parseISO } from 'date-fns';
import { DEFAULT_FORMAT_SETTINGS, formatDate } from '@exyconn/i18n';
import { AnalyticsCharts } from '../../../../src/admin/analytics/AnalyticsCharts';
import { renderWithProviders } from '../../test-utils';
import { demoStats } from '../admin.fixtures';

vi.mock('@exyconn/shell/components/ui', async (importOriginal) => {
  const { ChartStub } = await import('./chart-stub');
  return {
    ...(await importOriginal<object>()),
    TrendChart: ChartStub,
    BarChart: ChartStub,
  };
});

describe('AnalyticsCharts', () => {
  it('heads the daily chart and says when the period has no day to draw', () => {
    renderWithProviders(<AnalyticsCharts stats={demoStats({ daily: [] })} />);
    expect(screen.getByRole('heading', { name: 'Activity per day' })).toBeInTheDocument();
    expect(
      screen.getByText('Sessions, and flows started and completed, each day of the period'),
    ).toBeInTheDocument();
    expect(screen.getByText('Nothing tracked in this period.')).toBeInTheDocument();
    expect(screen.getAllByRole('list', { name: 'chart' })).toHaveLength(2);
  });

  it('draws the daily series, the industries opened and the devices used', () => {
    renderWithProviders(
      <AnalyticsCharts
        stats={demoStats({
          topDemos: [{ key: 'clinic', label: 'Healthcare', count: 1200 }],
          devices: [{ key: 'phone', label: 'Phone', count: 10 }],
        })}
      />,
    );
    const day = formatDate(parseISO('2026-10-01'), DEFAULT_FORMAT_SETTINGS);
    expect(screen.getByText(`Sessions — ${day}: 4`)).toBeInTheDocument();
    expect(screen.getByText(`Flows started — ${day}: 3`)).toBeInTheDocument();
    expect(screen.getByText(`Flows completed — ${day}: 2`)).toBeInTheDocument();
    expect(screen.getByText('Times opened — Healthcare: 1,200')).toBeInTheDocument();
    expect(screen.getByText('Sessions — Phone: 10')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Top industries' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Devices' })).toBeInTheDocument();
  });

  it('says so when no industry or device was recorded', () => {
    renderWithProviders(<AnalyticsCharts stats={demoStats({ topDemos: [], devices: [] })} />);
    expect(screen.getByText('No industry demo was opened in this period.')).toBeInTheDocument();
    expect(screen.getByText('No device was recorded in this period.')).toBeInTheDocument();
    // Only the daily chart is drawn.
    expect(screen.getAllByRole('list', { name: 'chart' })).toHaveLength(1);
  });
});

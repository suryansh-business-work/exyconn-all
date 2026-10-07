import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { StatusCharts } from '../../../../src/pages/status/StatusCharts';
import { renderWithProviders } from '../../test-utils';
import { dayPoint } from './status.fixtures';

vi.mock('@exyconn/shell/components/ui', async (importOriginal) => {
  const stubs = await import('./chart-stubs');
  return {
    ...(await importOriginal<typeof import('@exyconn/shell/components/ui')>()),
    ChartCard: stubs.ChartCardStub,
    TrendChart: stubs.TrendChartStub,
  };
});

describe('StatusCharts', () => {
  it('waits for a measured day instead of drawing empty charts', () => {
    renderWithProviders(<StatusCharts daily={[dayPoint('2026-09-03', 0)]} />);
    expect(
      screen.getByText('Daily charts appear once the monitor has collected a full day of checks.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('charts daily uptime as percentages, skipping days with no checks', () => {
    renderWithProviders(
      <StatusCharts
        daily={[dayPoint('2026-09-01', 4, 1), dayPoint('2026-09-02', 0), dayPoint('2026-09-03', 2)]}
      />,
    );
    const uptime = within(screen.getByRole('region', { name: 'Daily uptime' }));
    expect(uptime.getByText('Share of checks that succeeded, per day')).toBeInTheDocument();
    expect(uptime.getByText('Table heading: Day')).toBeInTheDocument();
    expect(uptime.getByRole('listitem')).toHaveTextContent('Uptime — 1 Sep: 75%, 3 Sep: 100%');
  });

  it('charts the mean response time in whole milliseconds', () => {
    renderWithProviders(
      <StatusCharts
        daily={[dayPoint('2026-09-01', 4, 0, 180.4), dayPoint('2026-09-03', 2, 0, 1234.6)]}
      />,
    );
    const latency = within(screen.getByRole('region', { name: 'Average response time' }));
    expect(
      latency.getByText('Mean round trip across all services, in milliseconds'),
    ).toBeInTheDocument();
    expect(latency.getByRole('listitem')).toHaveTextContent(
      `Response time — 1 Sep: 180 ms, 3 Sep: ${(1235).toLocaleString()} ms`,
    );
  });
});

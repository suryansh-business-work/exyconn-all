import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AssetCategory } from '@exyconn/shell/graphql/generated';
import { ReportsPage } from '../../../../src/pages/insights';
import { chart, drawn, resetDrawn, tilePairs } from './charts.mocks';
import { renderWithProviders } from '../../test-utils';

const gql = vi.hoisted(() => ({ report: vi.fn() }));

vi.mock('react-chartjs-2', () => ({ Line: () => <canvas data-testid="trend" /> }));
vi.mock('@exyconn/shell/components/dashboard/MetricChart', async () =>
  (await import('./charts.mocks')).metricChartMock(),
);
vi.mock('@exyconn/shell/components/dashboard/StatRow', async () =>
  (await import('./charts.mocks')).statRowMock(),
);
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../../core/settings.mock')).settingsModuleMock(),
);
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useItReportQuery: gql.report,
}));

const metric = (label: string, value: number) => ({ label, value });

const report = {
  months: 6,
  avgResolutionHours: 4.24,
  slaMetPercent: 92.6,
  breachedOpen: 1234.4,
  mttrHours: 1.96,
  ticketsByStatus: [metric('OPEN', 4)],
  ticketTrend: [{ period: '2026-09', opened: 5, resolved: 4 }],
  assetUtilization: [
    { category: AssetCategory.Laptop, total: 4, assigned: 3 },
    { category: AssetCategory.Printer, total: 0, assigned: 0 },
  ],
  incidentsBySeverity: [metric('SEV1', 1)],
  incidentsByMonth: [metric('2026-09', 2)],
  spend: { byCategory: [metric('CLOUD', 900)] },
};

const answer = (data: object | undefined, loading: boolean, error?: { message: string }) =>
  gql.report.mockReturnValue({ data, loading, error });

describe('ReportsPage', () => {
  beforeEach(() => {
    resetDrawn();
    gql.report.mockReset();
  });

  it('reports on the last six months by default, with a spinner until it answers', () => {
    answer(undefined, true);
    renderWithProviders(<ReportsPage />);
    expect(gql.report).toHaveBeenCalledWith({
      variables: { months: 6 },
      fetchPolicy: 'cache-and-network',
    });
    expect(screen.getByRole('heading', { name: 'Reports & Analytics' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '6 months' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('switches the period, and keeps it when the chosen period is clicked again', async () => {
    answer(undefined, false);
    renderWithProviders(<ReportsPage />);
    await userEvent.click(screen.getByRole('button', { name: '12 months' }));
    expect(gql.report).toHaveBeenLastCalledWith({
      variables: { months: 12 },
      fetchPolicy: 'cache-and-network',
    });
    await userEvent.click(screen.getByRole('button', { name: '12 months' }));
    expect(screen.getByRole('button', { name: '12 months' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(gql.report).toHaveBeenLastCalledWith({
      variables: { months: 12 },
      fetchPolicy: 'cache-and-network',
    });
  });

  it('leads with the SLA, resolution time, late tickets and incident recovery time', () => {
    answer({ itReport: report }, true);
    renderWithProviders(<ReportsPage />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(tilePairs()).toEqual([
      ['SLA met', '93%'],
      ['Avg resolution', '4.2h'],
      ['Breached, still open', (1234).toLocaleString()],
      ['Incident MTTR', '2.0h'],
    ]);
    expect(screen.getByTestId('trend')).toBeInTheDocument();
  });

  it('charts tickets, asset use, incidents and spend from the same report', () => {
    answer({ itReport: report }, false);
    renderWithProviders(<ReportsPage />);
    expect(drawn.charts.map((drawnChart) => drawnChart.title)).toEqual([
      'Tickets by status',
      'Asset utilisation',
      'Incidents by severity',
      'Incidents per month',
      'IT spend',
    ]);
    expect(chart('Tickets by status')).toMatchObject({
      metrics: report.ticketsByStatus,
      horizontal: true,
      integer: true,
    });
    expect(chart('Tickets by status').formatValue(2.5)).toBe('3');
    expect(chart('Asset utilisation').metrics).toEqual([
      { label: AssetCategory.Laptop, value: 75 },
      { label: AssetCategory.Printer, value: 0 },
    ]);
    expect(chart('Asset utilisation').formatValue(75)).toBe('75%');
    expect(chart('Incidents by severity')).toMatchObject({ metrics: report.incidentsBySeverity });
    expect(chart('Incidents per month')).toMatchObject({ metrics: report.incidentsByMonth });
    expect(chart('IT spend').metrics).toBe(report.spend.byCategory);
    expect(chart('IT spend').formatValue(900)).toBe('INR 900');
  });

  it('says why the report could not load', () => {
    answer(undefined, false, { message: 'Report timed out' });
    renderWithProviders(<ReportsPage />);
    expect(screen.getByText('Report timed out')).toBeInTheDocument();
    expect(drawn.tiles).toBeNull();
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { CostPage } from '../../../../src/pages/insights';
import { chart, drawn, resetDrawn, tilePairs } from './charts.mocks';
import { renderWithProviders } from '../../test-utils';

const gql = vi.hoisted(() => ({ cost: vi.fn() }));

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
  useItCostSummaryQuery: gql.cost,
}));

const metric = (label: string, value: number) => ({ label, value });

const summary = {
  saasMonthly: 1200,
  cloudMonthly: 800,
  annualRunRate: 24000,
  hardwareThisYear: 5000,
  procurementThisYear: 2500,
  byCategory: [metric('SAAS', 14400)],
  byVendor: [metric('Hetzner', 9600)],
  oneOffByMonth: [metric('2026-09', 5000)],
};

const answer = (data: object | undefined, loading: boolean, error?: { message: string }) =>
  gql.cost.mockReturnValue({ data, loading, error });

describe('CostPage', () => {
  beforeEach(() => {
    resetDrawn();
    gql.cost.mockReset();
  });

  it('asks for the costs fresh and shows a spinner until they answer', () => {
    answer(undefined, true);
    renderWithProviders(<CostPage />);
    expect(gql.cost).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
    expect(screen.getByRole('heading', { name: 'IT Cost & Budget' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(drawn.tiles).toBeNull();
  });

  it('shows the monthly run rate and what was bought this year in company money', () => {
    answer({ itCostSummary: summary }, true);
    renderWithProviders(<CostPage />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(tilePairs()).toEqual([
      ['SaaS per month', 'INR 1200'],
      ['Cloud per month', 'INR 800'],
      ['Annual run rate', 'INR 24000'],
      ['Bought this year', 'INR 7500'],
    ]);
  });

  it('charts spend by category, by vendor and one-off spend by month', () => {
    answer({ itCostSummary: summary }, false);
    renderWithProviders(<CostPage />);
    expect(drawn.charts.map((drawnChart) => drawnChart.title)).toEqual([
      'Spend by category',
      'Top vendors',
      'One-off spend by month',
    ]);
    expect(chart('Spend by category')).toMatchObject({
      metrics: summary.byCategory,
      labelHeading: 'Category',
      horizontal: true,
      subtitle: 'Running costs per year, one-off spend this year',
    });
    expect(chart('Top vendors')).toMatchObject({ metrics: summary.byVendor, horizontal: true });
    expect(chart('One-off spend by month')).toMatchObject({
      metrics: summary.oneOffByMonth,
      labelHeading: 'Month',
    });
    expect(chart('One-off spend by month').horizontal).toBeUndefined();
    expect(chart('Top vendors').formatValue(99)).toBe('INR 99');
  });

  it('says why the costs could not load', () => {
    answer(undefined, false, { message: 'Not allowed to see costs' });
    renderWithProviders(<CostPage />);
    expect(screen.getByText('Not allowed to see costs')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(drawn.charts).toEqual([]);
  });
});

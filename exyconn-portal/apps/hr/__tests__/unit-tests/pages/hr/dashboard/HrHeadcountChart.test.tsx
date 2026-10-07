import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { HrHeadcountChart } from '../../../../../src/pages/hr/dashboard/HrHeadcountChart';
import { renderWithProviders } from '../../../test-utils';

vi.mock('@exyconn/shell/components/ui', async (importOriginal) => {
  const stubs = await import('./chart-stubs');
  return {
    ...(await importOriginal<typeof import('@exyconn/shell/components/ui')>()),
    ChartCard: stubs.ChartCardStub,
    TrendChart: stubs.TrendChartStub,
  };
});

const TITLE = 'Employee count over time';

describe('HrHeadcountChart', () => {
  it('says it is loading rather than drawing an empty chart', () => {
    renderWithProviders(<HrHeadcountChart points={[]} loading />);
    expect(screen.getByText(TITLE)).toBeInTheDocument();
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: TITLE })).not.toBeInTheDocument();
  });

  it('says one month is not a trend', () => {
    renderWithProviders(
      <HrHeadcountChart points={[{ label: 'Mar', count: 12 }]} loading={false} />,
    );
    expect(screen.getByText('Not enough history to chart yet.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('charts two or more months as whole headcounts', () => {
    renderWithProviders(
      <HrHeadcountChart
        points={[
          { label: 'Jan', count: 10 },
          { label: 'Feb', count: 11.6 },
          { label: 'Mar', count: 14 },
        ]}
        loading
      />,
    );
    expect(screen.getByRole('region', { name: TITLE })).toBeInTheDocument();
    expect(screen.getByText('3 months')).toBeInTheDocument();
    expect(screen.getByText('Table heading: Month')).toBeInTheDocument();
    expect(screen.getByRole('listitem')).toHaveTextContent('Employees — Jan: 10, Feb: 12, Mar: 14');
  });
});

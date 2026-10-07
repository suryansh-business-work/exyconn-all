import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CompanyFinanceQuery } from '@exyconn/shell/graphql/generated';
import { formatMoney } from '@exyconn/shell/utils/money';
import { FinanceOverviewPage } from '../../../../src/pages/finance';
import { renderWithProviders } from '../../test-utils';

type Finance = CompanyFinanceQuery['companyFinance'];

const gql = vi.hoisted(() => ({ result: vi.fn(), options: [] as unknown[] }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCompanyFinanceQuery: (options: unknown) => {
    gql.options.push(options);
    return gql.result();
  },
}));

interface DrawnProps {
  data: { labels: string[]; datasets: { data: number[] }[] };
}

/** Chart.js needs a canvas jsdom lacks; the stand-in prints what it was asked to draw. */
vi.mock('react-chartjs-2', () => {
  const Drawn = ({ data }: Readonly<DrawnProps>) => (
    <output data-testid="chart">
      {JSON.stringify({ labels: data.labels, values: data.datasets.map((set) => set.data) })}
    </output>
  );
  return { Bar: Drawn, Line: Drawn };
});

const FINANCE: Finance = {
  from: '2026-07-01T00:00:00.000Z',
  to: '2026-09-04T23:59:59.999Z',
  invoiced: 9000,
  expenses: 2000,
  payroll: 5000,
  reimbursements: 500,
  totalCost: 7500,
  profit: -1200.4,
  collected: 6000,
  paidOut: 4000,
  netCash: 2000,
  outstandingReceivable: 3000,
  outstandingPayable: 800,
  overduePayable: 300,
  byCategory: [{ key: 'SOFTWARE', label: 'SOFTWARE', amount: 1999.6 }],
  months: [
    { month: '2026-08', label: 'Aug', revenue: 4000, cost: 3000, profit: 1000.4 },
    { month: '2026-09', label: 'Sep', revenue: 5000, cost: 7200, profit: -2200.6 },
  ],
};

const loaded = (finance: Finance) => ({ data: { companyFinance: finance }, loading: false });

function drawn(): { labels: string[]; values: number[][] }[] {
  return screen.getAllByTestId('chart').map((chart) => JSON.parse(chart.textContent ?? '{}'));
}

describe('FinanceOverviewPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-04T10:30:00.000Z'));
    gql.options.length = 0;
    gql.result.mockReturnValue(loaded(FINANCE));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('asks for the last three months, ending today, by default', () => {
    renderWithProviders(<FinanceOverviewPage />);

    expect(gql.options[0]).toEqual({
      variables: { from: '2026-07-01T00:00:00.000Z', to: '2026-09-04T23:59:59.999Z' },
      fetchPolicy: 'cache-and-network',
    });
    expect(screen.getByText('Company finances · Last 3 months')).toBeInTheDocument();
    expect(screen.getByText('Last 3 months, ending today')).toBeInTheDocument();
  });

  it('shows a loading state on the first load instead of a page of zeros', () => {
    gql.result.mockReturnValue({ data: undefined, loading: true });
    renderWithProviders(<FinanceOverviewPage />);

    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(screen.queryByText('Earned and spent')).not.toBeInTheDocument();
  });

  it('keeps accrual, cash and today’s position in separate panels', () => {
    renderWithProviders(<FinanceOverviewPage />);

    expect(screen.getByText('Earned and spent')).toBeInTheDocument();
    expect(screen.getByText('Cash movement')).toBeInTheDocument();
    expect(screen.getByText('Position today')).toBeInTheDocument();
    expect(screen.getByText('Reimbursed claims')).toBeInTheDocument();
    expect(screen.getByText(formatMoney(-500))).toBeInTheDocument();
    expect(screen.getByText('Of which already late')).toBeInTheDocument();
    expect(screen.getByText(formatMoney(-300))).toBeInTheDocument();
    expect(screen.getByText('Net cash movement')).toBeInTheDocument();
    expect(screen.getAllByText(formatMoney(-1200.4)).length).toBeGreaterThanOrEqual(2);
  });

  it('charts profit by month and spend by category in whole units', () => {
    renderWithProviders(<FinanceOverviewPage />);

    expect(screen.getByRole('heading', { name: 'Profit by month' })).toBeInTheDocument();
    expect(drawn()).toEqual([
      { labels: ['Aug', 'Sep'], values: [[1000, -2201]] },
      { labels: ['Software'], values: [[2000]] },
    ]);
  });

  it('says so when the period has no months and no spend', () => {
    gql.result.mockReturnValue(loaded({ ...FINANCE, months: [], byCategory: [] }));
    renderWithProviders(<FinanceOverviewPage />);

    expect(screen.getByText('No company expenses recorded in this period.')).toBeInTheDocument();
    expect(screen.queryByTestId('chart')).not.toBeInTheDocument();
  });

  it('reads every figure as zero when the server answered with nothing', () => {
    gql.result.mockReturnValue({ data: undefined, loading: false });
    renderWithProviders(<FinanceOverviewPage />);

    const position = screen.getByText('Position today').parentElement as HTMLElement;
    expect(within(position).getAllByText(formatMoney(0)).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Loading…')).not.toBeInTheDocument();
  });

  it('re-asks for the period somebody picks', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FinanceOverviewPage />);

    await user.click(screen.getByRole('combobox', { name: /Period/ }));
    await user.click(screen.getByRole('option', { name: 'Last 12 months' }));

    expect(gql.options.at(-1)).toMatchObject({
      variables: { from: '2025-10-01T00:00:00.000Z', to: '2026-09-04T23:59:59.999Z' },
    });
    expect(screen.getByText('Company finances · Last 12 months')).toBeInTheDocument();
  });
});

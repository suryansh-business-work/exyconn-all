import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import type { TrackerBillingByProjectQuery } from '@exyconn/shell/graphql/generated';
import { TimeLogBilling } from '../../../../../src/pages/projects/time-log/TimeLogBilling';
import { renderWithProviders } from '../../../test-utils';

type BillingRow = TrackerBillingByProjectQuery['trackerBillingByProject'][number];
type BillingEmployee = BillingRow['employees'][number];

const gql = vi.hoisted(() => ({ billing: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useTrackerBillingByProjectQuery: (options: unknown) => gql.billing(options),
}));

const usd = new Intl.NumberFormat('en', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

const employee = (id: string, rate: number): BillingEmployee => ({
  __typename: 'ProjectBillingEmployee',
  employeeId: id,
  employeeName: `Person ${id}`,
  hours: 4,
  rate,
  amount: rate * 4,
});

function billingRow(overrides: Partial<BillingRow> = {}): BillingRow {
  return {
    __typename: 'ProjectBillingRow',
    projectId: 'proj-1',
    projectName: 'Website',
    clientId: null,
    clientName: 'Northwind',
    currency: 'USD',
    hours: 12.5,
    amount: 1200,
    budgetHours: null,
    budgetAmount: null,
    employees: [employee('e1', 96)],
    ...overrides,
  };
}

const answer = (rows: BillingRow[] | undefined) =>
  gql.billing.mockReturnValue({ data: rows ? { trackerBillingByProject: rows } : undefined });

const RANGE = { from: '2026-10-01T00:00:00.000Z', to: '2026-11-01T00:00:00.000Z' };

describe('TimeLogBilling', () => {
  beforeEach(() => {
    gql.billing.mockReset();
  });

  it('draws nothing until the month has been priced', () => {
    answer(undefined);
    renderWithProviders(<TimeLogBilling projectId="proj-1" {...RANGE} budgetAmount={null} />);

    expect(screen.queryByText(/^Billing/)).not.toBeInTheDocument();
    expect(gql.billing).toHaveBeenCalledWith({
      variables: { projectId: 'proj-1', ...RANGE },
      fetchPolicy: 'cache-and-network',
    });
  });

  it('draws nothing for a month with no billable rows', () => {
    answer([]);
    renderWithProviders(<TimeLogBilling projectId="proj-1" {...RANGE} budgetAmount={500} />);

    expect(screen.queryByText(/^Billing/)).not.toBeInTheDocument();
    expect(screen.queryByText('Over budget')).not.toBeInTheDocument();
  });

  it('prices the month in the project currency when no budget was agreed', () => {
    answer([billingRow()]);
    renderWithProviders(<TimeLogBilling projectId="proj-1" {...RANGE} budgetAmount={null} />);

    expect(screen.getByText(`Billing: 12.5 h · ${usd.format(1200)}`)).toBeInTheDocument();
    expect(screen.queryByText('Over budget')).not.toBeInTheDocument();
    expect(screen.queryByText(/without a billing rate/)).not.toBeInTheDocument();
  });

  it('sets the month against the agreed budget, within it at exactly the budget', () => {
    answer([billingRow()]);
    renderWithProviders(<TimeLogBilling projectId="proj-1" {...RANGE} budgetAmount={1200} />);

    expect(
      screen.getByText(`Billing: 12.5 h · ${usd.format(1200)} of ${usd.format(1200)} budget`),
    ).toBeInTheDocument();
    expect(screen.queryByText('Over budget')).not.toBeInTheDocument();
  });

  it('flags a month that costs more than the budget', () => {
    answer([billingRow({ amount: 1500.75 })]);
    renderWithProviders(<TimeLogBilling projectId="proj-1" {...RANGE} budgetAmount={1000} />);

    expect(
      screen.getByText(`Billing: 12.5 h · ${usd.format(1500.75)} of ${usd.format(1000)} budget`),
    ).toBeInTheDocument();
    expect(screen.getByText('Over budget').closest('.MuiChip-root')).toHaveClass(
      'MuiChip-colorError',
    );
  });

  it('counts the people whose time could not be priced for want of a rate', () => {
    answer([
      billingRow({ employees: [employee('e1', 96), employee('e2', 0), employee('e3', -1)] }),
    ]);
    renderWithProviders(<TimeLogBilling projectId="proj-1" {...RANGE} budgetAmount={null} />);

    expect(screen.getByText('2 without a billing rate')).toBeInTheDocument();
  });
});

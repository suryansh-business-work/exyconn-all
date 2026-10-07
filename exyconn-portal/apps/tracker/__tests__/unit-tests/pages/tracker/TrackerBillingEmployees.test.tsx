import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { TrackerBillingEmployees } from '../../../../src/pages/tracker/TrackerBillingEmployees';
import { EMPLOYEE_BILLING_CSV, moneyFormat } from '../../../../src/pages/tracker/tracker.billing';
import { renderWithProviders } from '../../test-utils';
import { billingRow, queryResult } from './tracker.fixtures';
import { csvProps, resetRecorded } from './tracker.mocks';

interface Drawn {
  chart: { rows: unknown[]; title: string; labelHeading: string } | null;
  table: { rows: unknown[]; money: Intl.NumberFormat; loading: boolean; onRefresh: unknown } | null;
}

const state = vi.hoisted(() => ({ query: vi.fn(), refetch: vi.fn(), drawn: {} as Drawn }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useTrackerBillingQuery: state.query,
}));
vi.mock('@exyconn/crud', async () => (await import('./tracker.mocks')).crudModuleMock());
vi.mock('../../../../src/pages/tracker/TrackerBillingChart', () => ({
  TrackerBillingChart: (props: Readonly<NonNullable<Drawn['chart']>>) => {
    state.drawn.chart = props;
    return null;
  },
}));
vi.mock('../../../../src/pages/tracker/TrackerBillingTable', () => ({
  TrackerBillingTable: (props: Readonly<NonNullable<Drawn['table']>>) => {
    state.drawn.table = props;
    return null;
  },
}));

const range = { from: '2026-01-01T00:00:00.000Z', to: '2026-02-01T00:00:00.000Z' };
const NOTICE_TAIL = 'Set one on their employee record in HR';

function answer(rows: ReturnType<typeof billingRow>[], loading = false) {
  state.query.mockReturnValue(
    queryResult(
      {
        trackerBilling: {
          from: range.from,
          to: range.to,
          totalHours: 20,
          totalAmount: 1234.5,
          currency: 'USD',
          rows,
        },
      },
      loading,
      { refetch: state.refetch },
    ),
  );
}

describe('TrackerBillingEmployees', () => {
  beforeEach(() => {
    resetRecorded();
    state.query.mockReset();
    state.drawn = { chart: null, table: null };
  });

  it('asks for the period fresh and shows a spinner, not zeros, on the first load', () => {
    state.query.mockReturnValue(queryResult(undefined, true, { refetch: state.refetch }));
    renderWithProviders(<TrackerBillingEmployees range={range} />);
    expect(state.query).toHaveBeenCalledWith({
      variables: range,
      fetchPolicy: 'cache-and-network',
    });
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
    expect(state.drawn.chart).toBeNull();
    expect(state.drawn.table?.loading).toBe(true);
    expect(state.drawn.table?.rows).toEqual([]);
  });

  it('totals the hours and amount in the report currency and charts each employee', () => {
    const rows = [billingRow(), billingRow({ id: 'emp-2', name: 'Dev Mehta', hours: 7.5 })];
    answer(rows);
    renderWithProviders(<TrackerBillingEmployees range={range} />);
    expect(screen.getByText('Hours')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText(moneyFormat('USD').format(1234.5))).toBeInTheDocument();
    expect(screen.queryByText(new RegExp(NOTICE_TAIL))).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(state.drawn.chart).toEqual({
      rows,
      title: 'Billable hours by employee',
      subtitle: 'Tracked active time plus approved off-computer time',
      labelHeading: 'Employee',
    });
    expect(state.drawn.table?.rows).toBe(rows);
    expect(state.drawn.table?.money.resolvedOptions().currency).toBe('USD');
    expect(state.drawn.table?.loading).toBe(false);
    expect(state.drawn.table?.onRefresh).toBe(state.refetch);
  });

  it('exports exactly the rows on screen', async () => {
    const rows = [billingRow()];
    answer(rows);
    renderWithProviders(<TrackerBillingEmployees range={range} />);
    expect(csvProps().fileName).toBe('billing-by-employee');
    expect(csvProps().columns).toBe(EMPLOYEE_BILLING_CSV);
    await expect(csvProps().loadRows()).resolves.toBe(rows);
  });

  it('warns about the one employee whose time nobody priced', () => {
    answer([billingRow(), billingRow({ id: 'emp-2', rated: false })]);
    renderWithProviders(<TrackerBillingEmployees range={range} />);
    expect(
      screen.getByText(/^1 employee has tracked time but no billing rate\./),
    ).toHaveTextContent(NOTICE_TAIL);
  });

  it('warns about several unpriced employees in the plural', () => {
    answer([billingRow({ rated: false }), billingRow({ id: 'emp-2', rated: false })]);
    renderWithProviders(<TrackerBillingEmployees range={range} />);
    expect(
      screen.getByText(/^2 employees have tracked time but no billing rate\./),
    ).toBeInTheDocument();
  });

  it('shows zero hours in plain numbers when the report has nothing to say', () => {
    state.query.mockReturnValue(queryResult(undefined, false, { refetch: state.refetch }));
    renderWithProviders(<TrackerBillingEmployees range={range} />);
    expect(screen.getAllByText('0')).toHaveLength(2);
    expect(state.drawn.chart?.rows).toEqual([]);
  });
});

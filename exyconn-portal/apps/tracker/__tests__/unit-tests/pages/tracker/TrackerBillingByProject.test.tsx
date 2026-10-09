import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { appUrl } from '@exyconn/shell/config/apps';
import { TrackerBillingByProject } from '../../../../src/pages/tracker/TrackerBillingByProject';
import {
  PROJECT_BILLING_CSV,
  moneyFormat,
  projectBillingLines,
} from '../../../../src/pages/tracker/tracker.billing';
import { renderWithProviders } from '../../test-utils';
import { projectRow, queryResult } from './tracker.fixtures';
import { csvProps, resetRecorded } from './tracker.mocks';

const state = vi.hoisted(() => ({ query: vi.fn(), create: vi.fn(), chartRows: null as unknown }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useTrackerBillingByProjectQuery: state.query,
  useCreateInvoiceFromTimeLogMutation: () => [state.create, { loading: false }],
}));
vi.mock('@exyconn/crud', async () => (await import('./tracker.mocks')).crudModuleMock());
vi.mock('../../../../src/pages/tracker/TrackerBillingChart', () => ({
  TrackerBillingChart: ({ rows }: Readonly<{ rows: unknown }>) => {
    state.chartRows = rows;
    return null;
  },
}));

const range = { from: '2026-01-01T00:00:00.000Z', to: '2026-02-01T00:00:00.000Z' };
const rows = [
  projectRow({ currency: 'EUR' }),
  projectRow({
    projectId: '',
    projectName: 'Unassigned time',
    clientId: null,
    clientName: '',
    currency: 'EUR',
    hours: 4,
    amount: 160,
    budgetHours: null,
    budgetAmount: null,
    employees: [{ employeeId: 'e1', employeeName: 'Asha Rao', hours: 4, rate: 40, amount: 160 }],
  }),
];

describe('TrackerBillingByProject', () => {
  beforeEach(() => {
    resetRecorded();
    state.chartRows = null;
    state.query.mockReset().mockReturnValue(queryResult({ trackerBillingByProject: rows }));
    state.create.mockReset().mockResolvedValue({
      data: {
        createInvoiceFromTimeLog: { id: 'i1', number: 'INV-7', amount: 1200, currency: 'EUR' },
      },
    });
  });

  it('asks for the period fresh and shows a spinner until the first answer', () => {
    state.query.mockReturnValue(queryResult(undefined, true));
    renderWithProviders(<TrackerBillingByProject range={range} />);
    expect(state.query).toHaveBeenCalledWith({
      variables: range,
      fetchPolicy: 'cache-and-network',
    });
    expect(
      screen.getByRole('progressbar', { name: 'Loading billing by project' }),
    ).toBeInTheDocument();
    expect(state.chartRows).toBeNull();
  });

  it('says plainly when the period has no booked time', async () => {
    state.query.mockReturnValue(queryResult({ trackerBillingByProject: [] }));
    renderWithProviders(<TrackerBillingByProject range={range} />);
    expect(screen.getByText('No tracked time in this range.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(state.chartRows).toEqual([]);
    await expect(csvProps().loadRows()).resolves.toEqual([]);
  });

  it('lists each project against its budget in the report currency, and charts it', () => {
    state.query.mockReturnValue(queryResult({ trackerBillingByProject: rows }, true));
    renderWithProviders(<TrackerBillingByProject range={range} />);
    expect(screen.getAllByRole('columnheader').map((cell) => cell.textContent)).toEqual([
      '',
      'Project',
      'Client',
      'Hours vs budget',
      'Amount vs budget',
      '',
    ]);
    const euros = moneyFormat('EUR');
    expect(screen.getByText(`${euros.format(1200)} of ${euros.format(5000)}`)).toBeInTheDocument();
    expect(screen.getByText('Unassigned time')).toBeInTheDocument();
    expect(screen.getByText('No client')).toBeInTheDocument();
    expect(state.chartRows).toEqual([
      { id: 'p1', name: 'Website rebuild', hours: 30 },
      { id: '', name: 'Unassigned time', hours: 4 },
    ]);
  });

  it('exports one line per employee per project', async () => {
    renderWithProviders(<TrackerBillingByProject range={range} />);
    expect(csvProps().fileName).toBe('billing-by-project');
    expect(csvProps().columns).toBe(PROJECT_BILLING_CSV);
    await expect(csvProps().loadRows()).resolves.toEqual(projectBillingLines(rows));
  });

  it('raises an invoice from a row and offers to open it in Finance', async () => {
    renderWithProviders(<TrackerBillingByProject range={range} />);
    const [invoiceable, unassigned] = screen.getAllByRole('button', { name: 'Create invoice' });
    expect(unassigned).toBeDisabled();
    await userEvent.click(invoiceable);
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create invoice' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const banner = await screen.findByText('Invoice INV-7 was created as a draft.');
    const alert = banner.closest('[role="alert"]');
    if (!(alert instanceof HTMLElement)) {
      throw new TypeError('The invoice banner is not an alert');
    }
    expect(state.create).toHaveBeenCalledWith({
      variables: { projectId: 'p1', from: range.from, to: range.to },
    });
    expect(within(alert).getByRole('link', { name: 'Open in Finance' })).toHaveAttribute(
      'href',
      appUrl('finance', '/finance/invoices'),
    );

    await userEvent.click(within(alert).getByRole('button', { name: 'Close' }));
    await waitFor(() =>
      expect(screen.queryByText('Invoice INV-7 was created as a draft.')).not.toBeInTheDocument(),
    );
  });
});

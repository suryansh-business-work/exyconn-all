import { describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  DeleteClientCommunicationDocument,
  FilterOp,
  ListClientCommunicationsPagedDocument,
  ListInvoicesPagedDocument,
  ListPaymentsPagedDocument,
  ListSupportTicketsPagedDocument,
} from '@exyconn/shell/graphql/generated';
import type { DocumentNode } from 'graphql';
import { renderWithProviders } from '../../../test-utils';
import { dashboardProps, TABLE_INPUT } from '../../../crud-dashboard.stub';
import { CommunicationsTab } from '../../../../../src/pages/clients/detail/tabs/CommunicationsTab';
import {
  InvoicesTab,
  PaymentsTab,
  TicketsTab,
} from '../../../../../src/pages/clients/detail/tabs/LedgerTabs';
import {
  INVOICE_COLUMNS,
  PAYMENT_COLUMNS,
} from '../../../../../src/pages/clients/detail/tabs/ledger-grids';
import { COMMUNICATION_COLUMNS } from '../../../../../src/pages/clients/detail/tabs/communications-grid';
import { CLIENT_ID, communication } from './client-detail.fixtures';

vi.mock('@exyconn/crud', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@exyconn/crud')>();
  const { CrudDashboardStub } = await import('../../../crud-dashboard.stub');
  return { ...actual, CrudDashboard: CrudDashboardStub };
});

const FILTERED = {
  input: {
    ...TABLE_INPUT,
    filters: [{ field: 'clientId', op: FilterOp.Equals, value: CLIENT_ID }],
  },
};

const page = (query: DocumentNode, field: string) => ({
  request: { query, variables: FILTERED },
  result: { data: { [field]: { __typename: 'Page', totalCount: 0, rows: [] } } },
});

describe('the client’s own lists', () => {
  it.each([
    ['invoices', InvoicesTab, ListInvoicesPagedDocument, 'listInvoicesPaged', 'Invoices'],
    ['payments', PaymentsTab, ListPaymentsPagedDocument, 'listPaymentsPaged', 'Payments'],
    [
      'tickets',
      TicketsTab,
      ListSupportTicketsPagedDocument,
      'listSupportTicketsPaged',
      'Support tickets',
    ],
  ])('asks the server only for this client’s %s', async (_name, Tab, query, field, title) => {
    renderWithProviders(<Tab clientId={CLIENT_ID} />, { mocks: [page(query, field)] });

    const props = dashboardProps();
    expect(props.title).toBe(title);
    expect(await props.fetchRows(TABLE_INPUT)).toEqual({ rows: [], totalCount: 0 });
  });

  it('formats money in each row’s own currency', () => {
    const amount = INVOICE_COLUMNS.find((column) => column.field === 'amount');
    const paid = PAYMENT_COLUMNS.find((column) => column.field === 'amount');
    const format = (column: { valueFormatter?: unknown } | undefined, data: object) =>
      (column?.valueFormatter as (params: object) => string)({
        data,
        value: undefined,
        context: {},
      });

    expect(format(amount, { amount: 1200, currency: 'USD', balanceDue: 0 })).toMatch(/1,200/);
    expect(format(paid, { amount: 50, currency: 'EUR' })).toMatch(/50/);
  });
});

describe('CommunicationsTab', () => {
  it('lists this client’s log with the date and time, and edits or deletes from a row', async () => {
    renderWithProviders(<CommunicationsTab clientId={CLIENT_ID} onChanged={vi.fn()} />, {
      mocks: [page(ListClientCommunicationsPagedDocument, 'listClientCommunicationsPaged')],
    });
    const props = dashboardProps();

    expect(props.permissionModule).toBe('Client');
    expect(await props.fetchRows(TABLE_INPUT)).toEqual({ rows: [], totalCount: 0 });
    const when = COMMUNICATION_COLUMNS[0].valueFormatter as (params: object) => string;
    const context = props.context as unknown as { formatDateTime: (value: string) => string };
    expect(when({ data: communication(), context })).toBe(
      context.formatDateTime('2026-10-02T10:30:00.000Z'),
    );
    expect(when({ data: undefined, context })).toBe('');
    expect(Object.keys(props.context.actions)).toEqual(['edit', 'delete']);
  });

  it('deletes an entry after confirming and recounts the overview', async () => {
    const user = userEvent.setup();
    const onChanged = vi.fn();
    renderWithProviders(<CommunicationsTab clientId={CLIENT_ID} onChanged={onChanged} />, {
      mocks: [
        {
          request: { query: DeleteClientCommunicationDocument, variables: { id: 'comm-1' } },
          result: { data: { deleteClientCommunication: true } },
        },
      ],
    });
    let pending: unknown;
    act(() => {
      pending = dashboardProps().context.actions.delete(communication());
    });
    await user.click(await screen.findByRole('button', { name: 'Delete' }));
    await pending;

    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  it('renders the log form for a new entry', () => {
    renderWithProviders(<CommunicationsTab clientId={CLIENT_ID} onChanged={vi.fn()} />, {
      mocks: [
        {
          request: { query: DeleteClientCommunicationDocument, variables: { id: 'comm-1' } },
          result: { data: { deleteClientCommunication: true } },
        },
      ],
    });
    const { renderForm } = dashboardProps();
    renderWithProviders(<>{renderForm?.(null)}</>);

    expect(screen.getByRole('textbox', { name: 'Subject' })).toBeInTheDocument();
  });
});

import type { ComponentProps, ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import {
  DeleteClientDocument,
  ListClientsPagedDocument,
  ListClientsStatsDocument,
} from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { dashboardProps, statValues, TABLE_INPUT, tableStats } from '../../crud-dashboard.stub';
import { ClientsPage } from '../../../../src/pages/clients';
import { ClientForm } from '../../../../src/pages/clients/forms/client';
import { CLIENT_COLUMNS } from '../../../../src/pages/clients/clients-grid';
import { client } from './client.fixtures';
import { contactsAnswer } from './hub-access.fixtures';

vi.mock('@exyconn/crud', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@exyconn/crud')>();
  const { CrudDashboardStub } = await import('../../crud-dashboard.stub');
  return { ...actual, CrudDashboard: CrudDashboardStub };
});

const stats = (counts: Record<string, Record<string, number>>): MockLink.MockedResponse => ({
  request: { query: ListClientsStatsDocument },
  result: { data: { listClientsStats: tableStats(9, counts) } },
});

const FULL_STATS = stats({
  status: { ACTIVE: 4, PROSPECT: 3, INACTIVE: 2 },
  country: { IN: 5, DE: 2, '': 2 },
});

const snackbar = () => document.querySelector('.MuiSnackbar-root');

type ClientFormElement = ReactElement<ComponentProps<typeof ClientForm>>;

describe('ClientsPage', () => {
  it('hands the dashboard the clients grid, restricted under the Client module', () => {
    renderWithProviders(<ClientsPage />, { mocks: [FULL_STATS] });
    const props = dashboardProps();
    expect(props.title).toBe('Clients');
    expect(props.entityLabel).toBe('client');
    expect(props.exportFileName).toBe('clients');
    expect(props.permissionModule).toBe('Client');
    expect(props.columnDefs).toBe(CLIENT_COLUMNS);
    expect(props.statsLoading).toBe(true);
  });

  it('counts clients by status, and countries without the clients that have none', async () => {
    renderWithProviders(<ClientsPage />, { mocks: [FULL_STATS] });
    await waitFor(() =>
      expect(statValues()).toEqual({
        Clients: '9',
        Active: '4',
        Prospects: '3',
        Inactive: '2',
        Countries: '2',
      }),
    );
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('counts no countries when the stats carry no country breakdown', async () => {
    renderWithProviders(<ClientsPage />, { mocks: [stats({ status: { ACTIVE: 9 } })] });
    await waitFor(() => expect(statValues().Active).toBe('9'));
    expect(statValues().Countries).toBe('0');
  });

  it('reads a page of clients from the server for the grid', async () => {
    const rows = [client()];
    renderWithProviders(<ClientsPage />, {
      mocks: [
        FULL_STATS,
        {
          request: { query: ListClientsPagedDocument, variables: () => true },
          result: { data: { listClientsPaged: { __typename: 'ClientPage', totalCount: 1, rows } } },
        },
      ],
    });
    await expect(dashboardProps().fetchRows(TABLE_INPUT)).resolves.toEqual({ rows, totalCount: 1 });
  });

  it('renders the client form wired to the dashboard', () => {
    renderWithProviders(<ClientsPage />, { mocks: [FULL_STATS] });
    const form = dashboardProps().renderForm?.(null) as ClientFormElement;
    expect(form.type).toBe(ClientForm);
    expect(form.props.initial).toBeNull();
    expect(form.props.onCancel).toBe(dashboardProps().crud?.close);
    expect(form.props.onDone).toBe(dashboardProps().crud?.onDone);
  });

  it('opens the edit form for the row the edit action was pressed on', () => {
    renderWithProviders(<ClientsPage />, { mocks: [FULL_STATS] });
    const row = client();
    act(() => {
      dashboardProps().context.actions.edit(row);
    });
    expect(dashboardProps().crud?.editing).toBe(row);
  });

  it('opens client hub access for a row, and closes it again', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ClientsPage />, { mocks: [FULL_STATS, contactsAnswer([])] });
    expect(screen.queryByText('Client hub access — Acme')).toBeNull();

    act(() => {
      dashboardProps().context.actions.hubAccess(client({ name: 'Acme' }));
    });
    expect(await screen.findByText('Client hub access — Acme')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByText('Client hub access — Acme')).toBeNull());
  });

  it('deletes a client after confirming by name', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ClientsPage />, {
      mocks: [
        FULL_STATS,
        {
          request: { query: DeleteClientDocument, variables: { id: 'client-1' } },
          result: { data: { deleteClient: true } },
        },
        FULL_STATS,
      ],
    });
    act(() => {
      dashboardProps().context.actions.delete(client());
    });
    const message = await screen.findByText('Delete client "Priya Shah"?');
    const dialog = within(message.closest('[role="dialog"]') as HTMLElement);
    await user.click(dialog.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(snackbar()).toHaveTextContent('Client deleted'));
  });
});

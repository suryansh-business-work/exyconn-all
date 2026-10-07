import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { downloadCsv } from '@exyconn/shell/utils/csv';
import { CrudDashboard } from '../../../src/page/CrudDashboard';
import { renderWithProviders } from '../test-utils';
import {
  acme,
  crudResource,
  fetchLeads,
  gridProps,
  leadColumns,
  stats,
  type Lead,
} from './dashboardFixtures';

vi.mock('@exyconn/shell/utils/csv', async (importActual) => ({
  ...(await importActual<typeof import('@exyconn/shell/utils/csv')>()),
  downloadCsv: vi.fn(),
}));
vi.mock('@exyconn/shell/components/data/ServerDataGrid', async () => ({
  ServerDataGrid: (await import('./dashboardFixtures')).GridStub,
}));

type DashboardProps = Parameters<typeof CrudDashboard<Lead, Lead>>[0];

const renderDashboard = (props: Partial<DashboardProps> = {}) =>
  renderWithProviders(
    <CrudDashboard<Lead, Lead>
      title="Leads"
      subtitle="Every lead in the pipeline"
      entityLabel="lead"
      stats={stats}
      columnDefs={leadColumns}
      fetchRows={fetchLeads()}
      context={{ actions: { edit: vi.fn() } }}
      searchPlaceholder="Search leads"
      {...props}
    />,
  );

describe('CrudDashboard list view', () => {
  it('renders the tiles, the grid and the slots around it, with no New button without crud', async () => {
    const context = { actions: { edit: vi.fn() } };
    const onRowClick = vi.fn();
    renderDashboard({
      context,
      refreshSignal: 3,
      onRowClick,
      toolbar: <span>Quick filters</span>,
      extraDialogs: <span>Send drawer</span>,
      children: <span>Footnote</span>,
    });

    expect(screen.getByText('Leads')).toBeInTheDocument();
    expect(screen.getByText('Open leads')).toBeInTheDocument();
    expect(screen.getByText('Quick filters')).toBeInTheDocument();
    expect(screen.getByText('Send drawer')).toBeInTheDocument();
    expect(screen.getByText('Footnote')).toBeInTheDocument();
    expect(screen.getByText('Search leads')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'New lead' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Export CSV' })).not.toBeInTheDocument();
    // No permission module: the page's own context goes to the grid untouched.
    expect(gridProps.current?.context).toBe(context);
    expect(gridProps.current?.refreshSignal).toBe(3);

    await userEvent.click(screen.getByRole('button', { name: 'open row' }));
    expect(onRowClick).toHaveBeenCalledWith(acme);
  });

  it('offers "New {entity}" and hands the grid the resource refresh signal', async () => {
    const crud = crudResource();
    renderDashboard({ crud, refreshSignal: 1 });

    await userEvent.click(screen.getByRole('button', { name: 'New lead' }));
    expect(crud.openCreate).toHaveBeenCalledTimes(1);
    expect(gridProps.current?.refreshSignal).toBe(5);
  });

  it('uses the page action label in place of "New {entity}"', () => {
    renderDashboard({ crud: crudResource(), actionLabel: 'Log a call' });
    expect(screen.getByRole('button', { name: 'Log a call' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'New lead' })).not.toBeInTheDocument();
  });

  it('stays on the list when the form is open but the page renders no form', () => {
    renderDashboard({ crud: crudResource({ open: true }) });
    expect(screen.getByTestId('grid')).toBeInTheDocument();
  });

  it('exports under the query the grid last reported', async () => {
    const fetchRows = fetchLeads();
    renderDashboard({ fetchRows, exportFileName: 'leads' });

    await userEvent.click(screen.getByRole('button', { name: 'query grid' }));
    await userEvent.click(screen.getByRole('button', { name: 'Export CSV' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Exported 1 rows.');
    expect(fetchRows).toHaveBeenCalledWith({
      search: 'acme',
      sort: null,
      filters: [],
      page: 0,
      pageSize: 200,
    });
    expect(downloadCsv).toHaveBeenCalledTimes(1);
  });
});

describe('CrudDashboard form view', () => {
  it('replaces the list with the create form', async () => {
    const crud = crudResource({ open: true });
    const renderForm = vi.fn((initial: Lead | null) => (
      <span>form for {initial?.name ?? 'new'}</span>
    ));
    renderDashboard({ crud, renderForm });

    expect(screen.getByRole('heading', { level: 1, name: 'New lead' })).toBeInTheDocument();
    expect(screen.getByText('form for new')).toBeInTheDocument();
    expect(renderForm).toHaveBeenCalledWith(null);
    expect(screen.queryByTestId('grid')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Back to Leads' }));
    expect(crud.close).toHaveBeenCalledTimes(1);
  });

  it('titles the form for the record being edited', () => {
    const crud = crudResource({ open: true, editing: acme });
    renderDashboard({ crud, renderForm: (initial) => <span>form for {initial?.name}</span> });

    expect(screen.getByRole('heading', { level: 1, name: 'Edit lead' })).toBeInTheDocument();
    expect(screen.getByText('form for Acme')).toBeInTheDocument();
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { ListStatusMonitorsPagedDocument, StatusState } from '@exyconn/shell/graphql/generated';
import { StatusMonitorsPage } from '../../../../src/pages/status-monitors';
import { STATUS_MONITOR_COLUMNS } from '../../../../src/pages/status-monitors/status-monitors-grid';
import { renderWithProviders } from '../../test-utils';
import { crudSpies, formRenders } from './status-monitors.stubs';

const gql = vi.hoisted(() => ({ stats: vi.fn(), remove: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListStatusMonitorsStatsQuery: gql.stats,
  useDeleteStatusMonitorMutation: () => [gql.remove],
}));
vi.mock('@exyconn/crud', async (importOriginal) =>
  (await import('./status-monitors.stubs')).crudModule(importOriginal),
);
vi.mock('../../../../src/pages/status-monitors/forms/status-monitor', async () => ({
  StatusMonitorForm: (await import('./status-monitors.stubs')).StatusMonitorFormStub,
}));

const crud = { openEdit: vi.fn(), remove: vi.fn(), close: vi.fn(), onDone: vi.fn() };
const fetchRows = vi.fn();

const STATS = {
  listStatusMonitorsStats: {
    total: 9,
    counts: [
      {
        field: 'state',
        buckets: [
          { value: StatusState.Operational, count: 6 },
          { value: StatusState.Degraded, count: 2 },
          { value: StatusState.Down, count: 1 },
        ],
      },
    ],
    sums: [],
  },
};

const stat = (label: string) =>
  screen.getByTestId(`stat-${label}`).querySelector('dd')?.textContent;
const dashboard = () => crudSpies.dashboard.mock.lastCall?.[0];

describe('StatusMonitorsPage', () => {
  beforeEach(() => {
    gql.stats.mockReset().mockReturnValue({ data: STATS, loading: false, refetch: gql.refetch });
    gql.remove.mockReset().mockResolvedValue({ data: {} });
    crudSpies.dashboard.mockReset();
    crudSpies.resource.mockReset().mockReturnValue(crud);
    crudSpies.fetcher.mockReset().mockReturnValue(fetchRows);
    formRenders.mockReset();
  });

  it('counts the monitors by the state they reported last', () => {
    renderWithProviders(<StatusMonitorsPage />);
    expect(stat('Monitors')).toBe('9');
    expect(stat('Operational')).toBe('6');
    expect(stat('Degraded')).toBe('2');
    expect(stat('Down')).toBe('1');
    expect(dashboard()?.statsLoading).toBe(false);
  });

  it('shows zeros with a loading flag until the stats arrive', () => {
    gql.stats.mockReturnValue({ data: undefined, loading: true, refetch: gql.refetch });
    renderWithProviders(<StatusMonitorsPage />);
    expect(stat('Monitors')).toBe('0');
    expect(stat('Down')).toBe('0');
    expect(dashboard()?.statsLoading).toBe(true);
  });

  it('describes the catalogue and wires the grid', () => {
    renderWithProviders(<StatusMonitorsPage />);
    expect(dashboard()).toMatchObject({
      title: 'Status Monitors',
      entityLabel: 'monitor',
      exportFileName: 'status-monitors',
      searchPlaceholder: 'Search by service, key or URL…',
      columnDefs: STATUS_MONITOR_COLUMNS,
      fetchRows,
      crud,
      context: { actions: { edit: crud.openEdit, delete: crud.remove } },
    });
  });

  it('pages through the monitors with the paged list query', () => {
    renderWithProviders(<StatusMonitorsPage />);
    const [document, select] = crudSpies.fetcher.mock.lastCall ?? [];
    expect(document).toBe(ListStatusMonitorsPagedDocument);
    const page = { rows: [], totalCount: 0 };
    expect(select({ listStatusMonitorsPaged: page })).toBe(page);
  });

  it('stops monitoring a service after naming it, then re-reads the stats', async () => {
    renderWithProviders(<StatusMonitorsPage />);
    const options = crudSpies.resource.mock.lastCall?.[0];
    expect(options.label).toBe('Status monitor');
    expect(options.refetch).toBe(gql.refetch);
    expect(options.confirmMessage({ id: 'm1', name: 'Tools API' })).toEqual({
      message: 'Stop monitoring "{name}"?',
      values: { name: 'Tools API' },
    });
    await options.onDelete({ id: 'm1', name: 'Tools API' });
    expect(gql.remove).toHaveBeenCalledWith({ variables: { id: 'm1' } });
  });

  it('opens the form wired to close and reload through the resource', () => {
    renderWithProviders(<StatusMonitorsPage />);
    expect(screen.getByText('Monitor form')).toBeInTheDocument();
    expect(formRenders.mock.lastCall?.[0]).toEqual({
      initial: null,
      onCancel: crud.close,
      onDone: crud.onDone,
    });
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ListStatusMaintenanceWindowsPagedDocument } from '@exyconn/shell/graphql/generated';
import { MaintenancePanel } from '../../../../src/pages/incidents/MaintenancePanel';
import { MaintenanceForm } from '../../../../src/pages/incidents/forms/maintenance';
import { MAINTENANCE_COLUMNS } from '../../../../src/pages/incidents/maintenance-grid';
import { renderWithProviders } from '../../test-utils';
import {
  crud,
  dashboardProps,
  fetchRows,
  fetcherCall,
  formatDate,
  resetPage,
  resourceOptions,
  statPairs,
  statsOf,
} from './crud-page.mocks';
import { maintenanceRow } from './incidents.fixtures';

const gql = vi.hoisted(() => ({ stats: vi.fn(), remove: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/crud', async () => (await import('./crud-page.mocks')).crudModuleMock());
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('./crud-page.mocks')).settingsModuleMock(),
);
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListStatusMaintenanceWindowsStatsQuery: gql.stats,
  useDeleteStatusMaintenanceMutation: () => [gql.remove],
}));

const answer = (data: object | undefined, loading: boolean) =>
  gql.stats.mockReturnValue({ data, loading, refetch: gql.refetch });

const row = maintenanceRow();

describe('MaintenancePanel', () => {
  beforeEach(() => {
    resetPage();
    gql.remove.mockReset();
    answer(undefined, true);
  });

  it('frames planned windows with edit and delete on each row', () => {
    renderWithProviders(<MaintenancePanel />);
    expect(dashboardProps()).toMatchObject({
      title: 'Maintenance',
      subtitle: 'Planned downtime, announced on the status page ahead of time',
      entityLabel: 'maintenance window',
      columnDefs: MAINTENANCE_COLUMNS,
      fetchRows,
      crud,
      searchPlaceholder: 'Search by title…',
    });
    expect(dashboardProps().context.actions.edit).toBe(crud.openEdit);
    expect(dashboardProps().context.actions.delete).toBe(crud.remove);
    expect(dashboardProps().context.formatDate).toBe(formatDate);
  });

  it('reads windows from the paged query and edits one in its own form', () => {
    renderWithProviders(<MaintenancePanel />);
    const paged = { rows: [row], totalCount: 1 };
    expect(fetcherCall().document).toBe(ListStatusMaintenanceWindowsPagedDocument);
    expect(fetcherCall().select({ listStatusMaintenanceWindowsPaged: paged })).toBe(paged);
    const form = dashboardProps().renderForm(row);
    expect(form.type).toBe(MaintenanceForm);
    expect(form.props).toEqual({ initial: row, onCancel: crud.close, onDone: crud.onDone });
  });

  it('counts the windows once the stats arrive', () => {
    const { rerender } = renderWithProviders(<MaintenancePanel />);
    expect(dashboardProps().statsLoading).toBe(true);
    expect(statPairs()).toEqual([['Windows', '0']]);

    answer({ listStatusMaintenanceWindowsStats: statsOf(3) }, false);
    rerender(<MaintenancePanel />);
    expect(dashboardProps().statsLoading).toBe(false);
    expect(statPairs()).toEqual([['Windows', '3']]);
  });

  it('cancels a window by id after confirming by title, then reloads its stats', async () => {
    gql.remove.mockResolvedValue({ data: {} });
    renderWithProviders(<MaintenancePanel />);
    const options = resourceOptions();
    expect(options.label).toBe('Maintenance window');
    expect(options.refetch).toBe(gql.refetch);
    expect(options.confirmMessage(row)).toEqual({
      message: 'Cancel the maintenance window "{title}"?',
      values: { title: 'Database upgrade' },
    });
    await options.onDelete(row);
    expect(gql.remove).toHaveBeenCalledWith({ variables: { id: 'mw-1' } });
  });
});

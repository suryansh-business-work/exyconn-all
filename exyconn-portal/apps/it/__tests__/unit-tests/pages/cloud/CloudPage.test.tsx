import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ListItCloudResourcesPagedDocument } from '@exyconn/shell/graphql/generated';
import { CloudPage } from '../../../../src/pages/cloud';
import { CloudResourceForm } from '../../../../src/pages/cloud/forms/cloud-resource';
import { CLOUD_COLUMNS } from '../../../../src/pages/cloud/cloud-grid';
import {
  crud,
  dashboardProps,
  fetchRows,
  fetcherCall,
  resetPage,
  resourceOptions,
  statPairs,
  statsOf,
} from '../../core/crud-page.mocks';
import { formatDate } from '../../core/settings.mock';
import { cloudRow } from '../../core/rows.fixtures';
import { renderWithProviders } from '../../test-utils';

const gql = vi.hoisted(() => ({ stats: vi.fn(), remove: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/crud', async () => (await import('../../core/crud-page.mocks')).crudModuleMock());
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../../core/settings.mock')).settingsModuleMock(),
);
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListItCloudResourcesStatsQuery: gql.stats,
  useDeleteItCloudResourceMutation: () => [gql.remove],
}));

const answer = (data: object | undefined, loading: boolean) =>
  gql.stats.mockReturnValue({ data, loading, refetch: gql.refetch });

const row = cloudRow();

describe('CloudPage', () => {
  beforeEach(() => {
    resetPage();
    gql.remove.mockReset();
    answer(undefined, true);
  });

  it('frames the infrastructure register with its columns, export name and actions', () => {
    renderWithProviders(<CloudPage />);
    const props = dashboardProps();
    expect(props).toMatchObject({
      title: 'Cloud & Infrastructure',
      entityLabel: 'cloud resource',
      exportFileName: 'cloud-resources',
      permissionModule: 'ItCloudResource',
      columnDefs: CLOUD_COLUMNS,
      fetchRows,
      crud,
      searchPlaceholder: 'Search by name, provider, endpoint or owner…',
    });
    expect(props.context).toEqual({
      actions: { edit: crud.openEdit, delete: crud.remove },
      formatDate,
    });
  });

  it('reads resources from the paged query and opens its own form', () => {
    renderWithProviders(<CloudPage />);
    const paged = { rows: [row], totalCount: 1 };
    expect(fetcherCall().document).toBe(ListItCloudResourcesPagedDocument);
    expect(fetcherCall().select({ listItCloudResourcesPaged: paged })).toBe(paged);
    const form = dashboardProps().renderForm?.(row);
    expect(form?.type).toBe(CloudResourceForm);
    expect(form?.props).toEqual({ initial: row, onCancel: crud.close, onDone: crud.onDone });
  });

  it('shows zero cost and counts until the stats answer', () => {
    renderWithProviders(<CloudPage />);
    expect(dashboardProps().statsLoading).toBe(true);
    expect(statPairs()).toEqual([
      ['Resources', '0'],
      ['Production', '0'],
      ['Down or degraded', '0'],
      ['Monthly cost', 'INR 0'],
    ]);
  });

  it('counts production, what is down or degraded, and the monthly bill', () => {
    answer(
      {
        listItCloudResourcesStats: statsOf(
          10,
          { environment: { PRODUCTION: 6 }, status: { DOWN: 1, DEGRADED: 2 } },
          { monthlyCost: 4200 },
        ),
      },
      true,
    );
    renderWithProviders(<CloudPage />);
    expect(dashboardProps().statsLoading).toBe(false);
    expect(statPairs()).toEqual([
      ['Resources', '10'],
      ['Production', '6'],
      ['Down or degraded', '3'],
      ['Monthly cost', 'INR 4200'],
    ]);
  });

  it('deletes by id after confirming by name, then reloads its stats', async () => {
    gql.remove.mockResolvedValue({ data: {} });
    renderWithProviders(<CloudPage />);
    const options = resourceOptions();
    expect(options.label).toBe('Cloud resource');
    expect(options.refetch).toBe(gql.refetch);
    expect(options.confirmMessage(row)).toEqual({
      message: 'Delete "{name}"?',
      values: { name: 'prod-db-1' },
    });
    await options.onDelete(row);
    expect(gql.remove).toHaveBeenCalledWith({ variables: { id: 'cloud-1' } });
  });
});

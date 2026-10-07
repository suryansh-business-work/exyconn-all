import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ListAssetsPagedDocument } from '@exyconn/shell/graphql/generated';
import { AssetsPage } from '../../../../src/pages/assets';
import { AssetForm } from '../../../../src/pages/assets/forms/asset';
import { ASSET_COLUMNS } from '../../../../src/pages/assets/assets-grid';
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
import { assetRow } from '../../core/rows.fixtures';
import { renderWithProviders } from '../../test-utils';

const gql = vi.hoisted(() => ({
  stats: vi.fn(),
  remove: vi.fn(),
  refetch: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => gql.navigate,
}));
vi.mock('@exyconn/crud', async () => (await import('../../core/crud-page.mocks')).crudModuleMock());
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListAssetsStatsQuery: gql.stats,
  useDeleteAssetMutation: () => [gql.remove],
}));

const answer = (data: object | undefined, loading: boolean) =>
  gql.stats.mockReturnValue({ data, loading, refetch: gql.refetch });

const row = assetRow();

describe('AssetsPage', () => {
  beforeEach(() => {
    resetPage();
    gql.remove.mockReset();
    gql.navigate.mockReset();
    answer(undefined, true);
  });

  it('frames the asset register with its columns, export name and row actions', () => {
    renderWithProviders(<AssetsPage />);
    const props = dashboardProps();
    expect(props).toMatchObject({
      title: 'Assets',
      entityLabel: 'asset',
      exportFileName: 'assets',
      columnDefs: ASSET_COLUMNS,
      fetchRows,
      crud,
      searchPlaceholder: 'Search by tag, name, serial or holder…',
    });
    expect(props.context).toEqual({ actions: { edit: crud.openEdit, delete: crud.remove } });
  });

  it('reads the register from the paged query and opens its own form', () => {
    renderWithProviders(<AssetsPage />);
    const paged = { rows: [row], totalCount: 1 };
    expect(fetcherCall().document).toBe(ListAssetsPagedDocument);
    expect(fetcherCall().select({ listAssetsPaged: paged })).toBe(paged);
    const form = dashboardProps().renderForm?.(row);
    expect(form?.type).toBe(AssetForm);
    expect(form?.props).toEqual({ initial: row, onCancel: crud.close, onDone: crud.onDone });
  });

  it('opens the asset page when a row is clicked', () => {
    renderWithProviders(<AssetsPage />);
    dashboardProps().onRowClick?.(row);
    expect(gql.navigate).toHaveBeenCalledWith('/it/assets/asset-1');
  });

  it('counts the estate by status once the stats answer', () => {
    const { rerender } = renderWithProviders(<AssetsPage />);
    expect(dashboardProps().statsLoading).toBe(true);

    answer(
      { listAssetsStats: statsOf(20, { status: { ASSIGNED: 12, IN_STOCK: 5, IN_REPAIR: 2 } }) },
      false,
    );
    rerender(<AssetsPage />);
    expect(dashboardProps().statsLoading).toBe(false);
    expect(statPairs()).toEqual([
      ['Assets', '20'],
      ['Assigned', '12'],
      ['In stock', '5'],
      ['In repair', '2'],
    ]);
  });

  it('deletes by id after confirming by tag, then reloads its stats', async () => {
    gql.remove.mockResolvedValue({ data: {} });
    renderWithProviders(<AssetsPage />);
    const options = resourceOptions();
    expect(options.label).toBe('Asset');
    expect(options.refetch).toBe(gql.refetch);
    expect(options.confirmMessage(row)).toEqual({
      message: 'Delete asset "{tag}"?',
      values: { tag: 'LT-001' },
    });
    await options.onDelete(row);
    expect(gql.remove).toHaveBeenCalledWith({ variables: { id: 'asset-1' } });
  });
});

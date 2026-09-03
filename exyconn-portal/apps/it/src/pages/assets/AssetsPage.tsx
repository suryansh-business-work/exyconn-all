import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import {
  useListAssetsStatsQuery,
  useDeleteAssetMutation,
  ListAssetsPagedDocument,
  type ListAssetsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { AssetForm, type AssetRow } from './forms/asset';
import { ASSET_COLUMNS, type PagedAssetRow, type AssetsGridContext } from './assets-grid';

/** IT module — the asset register, with a server-side grid over every item. */
export function AssetsPage() {
  // Stat cards come from one server aggregation; the grid is server-paged separately.
  const { data: statsData, refetch: refetchStats } = useListAssetsStatsQuery();
  const [deleteAsset] = useDeleteAssetMutation();
  const crud = useCrudResource<AssetRow, PagedAssetRow>({
    label: 'Asset',
    onDelete: (row) => deleteAsset({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete asset "${row.assetTag}"?`,
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListAssetsPagedDocument,
    (data: ListAssetsPagedQuery) => data.listAssetsPaged,
  );

  const stats = statsData?.listAssetsStats;
  const statItems: StatItem[] = [
    { label: 'Assets', value: String(statTotal(stats)), accent: '#4f8cff' },
    {
      label: 'Assigned',
      value: String(statCount(stats, 'status', 'ASSIGNED')),
      accent: '#7be37b',
    },
    {
      label: 'In stock',
      value: String(statCount(stats, 'status', 'IN_STOCK')),
      accent: '#f9851f',
    },
    {
      label: 'In repair',
      value: String(statCount(stats, 'status', 'IN_REPAIR')),
      accent: '#ff6b6b',
    },
  ];

  const gridContext: AssetsGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
  };

  return (
    <CrudDashboard
      title="Assets"
      subtitle="Every device and licence the company owns, and who holds it"
      entityLabel="asset"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <AssetForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={ASSET_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search by tag, name, serial or holder…"
    />
  );
}

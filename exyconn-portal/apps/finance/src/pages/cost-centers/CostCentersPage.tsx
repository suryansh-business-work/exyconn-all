import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import {
  useListCostCentersStatsQuery,
  useDeleteCostCenterMutation,
  ListCostCentersPagedDocument,
  type ListCostCentersPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { CostCenterForm, type CostCenterRow } from './forms/cost-center';
import { color } from '@exyconn/shell/components/ui';
import {
  COST_CENTER_COLUMNS,
  type PagedCostCenterRow,
  type CostCentersGridContext,
} from './cost-centers-grid';

/**
 * Finance → Cost centres: the buckets budgets are set against and spend is reported by.
 *
 * Kept apart from HR's department list on purpose — finance budgets against things HR has
 * no row for, and closing a department must not orphan years of spend booked to it.
 */
export function CostCentersPage() {
  const { data: statsData, refetch: refetchStats } = useListCostCentersStatsQuery();
  const [deleteCostCenter] = useDeleteCostCenterMutation();

  const crud = useCrudResource<CostCenterRow, PagedCostCenterRow>({
    label: 'Cost centre',
    onDelete: (row) => deleteCostCenter({ variables: { id: row.id } }),
    confirmMessage: (row) =>
      `Delete ${row.code}? Spend and budgets already booked to it will no longer have a centre. Retiring it instead keeps the history readable.`,
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListCostCentersPagedDocument,
    (data: ListCostCentersPagedQuery) => data.listCostCentersPaged,
  );

  const stats = statsData?.listCostCentersStats;
  const statItems: StatItem[] = [
    { label: 'Centres', value: String(statTotal(stats)), accent: color.blue[400] },
    {
      label: 'Active',
      value: String(statCount(stats, 'isActive', 'true')),
      accent: color.green[500],
    },
    {
      label: 'Retired',
      value: String(statCount(stats, 'isActive', 'false')),
      accent: color.slate[400],
    },
  ];

  const gridContext: CostCentersGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
  };

  return (
    <CrudDashboard
      title="Cost centres"
      subtitle="What the company budgets and reports its spend against"
      entityLabel="cost centre"
      exportFileName="cost-centres"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <CostCenterForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      permissionModule="CostCenter"
      columnDefs={COST_CENTER_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search by code, name or description…"
    />
  );
}

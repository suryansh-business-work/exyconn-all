import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import {
  useListSuppliersStatsQuery,
  useDeleteSupplierMutation,
  ListSuppliersPagedDocument,
  type ListSuppliersPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { SupplierForm, type SupplierRow } from './forms/supplier';
import { color } from '@exyconn/shell/components/ui';
import {
  SUPPLIER_COLUMNS,
  type PagedSupplierRow,
  type SuppliersGridContext,
} from './suppliers-grid';

/** Products → Suppliers: who stock is bought from. */
export function SuppliersPage() {
  const { data: statsData, refetch: refetchStats } = useListSuppliersStatsQuery();
  const [deleteSupplier] = useDeleteSupplierMutation();
  const crud = useCrudResource<SupplierRow, PagedSupplierRow>({
    label: 'Supplier',
    onDelete: (row) => deleteSupplier({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete supplier "${row.name}"?`,
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListSuppliersPagedDocument,
    (data: ListSuppliersPagedQuery) => data.listSuppliersPaged,
  );

  const stats = statsData?.listSuppliersStats;
  const statItems: StatItem[] = [
    { label: 'Suppliers', value: String(statTotal(stats)), accent: color.blue[400] },
    {
      label: 'Active',
      value: String(statCount(stats, 'status', 'ACTIVE')),
      accent: color.green[500],
    },
    {
      label: 'On hold',
      value: String(statCount(stats, 'status', 'ON_HOLD')),
      accent: color.amber[500],
    },
    {
      label: 'Inactive',
      value: String(statCount(stats, 'status', 'INACTIVE')),
      accent: color.red[200],
    },
  ];

  const gridContext: SuppliersGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
  };

  return (
    <CrudDashboard
      title="Suppliers"
      subtitle="Who stock is bought from"
      entityLabel="supplier"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <SupplierForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      permissionModule="Supplier"
      columnDefs={SUPPLIER_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search by name, code, contact or email…"
    />
  );
}

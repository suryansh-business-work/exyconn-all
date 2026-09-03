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
    { label: 'Suppliers', value: String(statTotal(stats)), accent: '#4f8cff' },
    { label: 'Active', value: String(statCount(stats, 'status', 'ACTIVE')), accent: '#22c55e' },
    { label: 'On hold', value: String(statCount(stats, 'status', 'ON_HOLD')), accent: '#f59e0b' },
    { label: 'Inactive', value: String(statCount(stats, 'status', 'INACTIVE')), accent: '#ff6b6b' },
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
      columnDefs={SUPPLIER_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search by name, code, contact or email…"
    />
  );
}

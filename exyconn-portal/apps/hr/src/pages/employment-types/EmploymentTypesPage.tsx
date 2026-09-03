import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useListEmploymentTypesStatsQuery,
  useDeleteEmploymentTypeMutation,
  ListEmploymentTypesPagedDocument,
  type ListEmploymentTypesPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { EmploymentTypeForm, type EmploymentTypeRow } from './forms/employment-type';
import {
  EMPLOYMENT_TYPE_COLUMNS,
  type PagedEmploymentTypeRow,
  type EmploymentTypeGridContext,
} from './employment-type-grid';

/** Employment Types — server-paged admin grid over the employment type records. */
export function EmploymentTypesPage() {
  const { data: statsData, refetch: refetchStats } = useListEmploymentTypesStatsQuery();
  const [deleteEmploymentType] = useDeleteEmploymentTypeMutation();
  const { formatDate } = useSettings();

  const crud = useCrudResource<EmploymentTypeRow, PagedEmploymentTypeRow>({
    label: 'EmploymentType',
    onDelete: (row) => deleteEmploymentType({ variables: { id: row.id } }),
    confirmMessage: () => 'Delete this employment type?',
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListEmploymentTypesPagedDocument,
    (data: ListEmploymentTypesPagedQuery) => data.listEmploymentTypesPaged,
  );

  const stats = statsData?.listEmploymentTypesStats;
  const statItems: StatItem[] = [
    { label: 'Types', value: String(statTotal(stats)), accent: '#059669' },
    { label: 'Active', value: String(statCount(stats, 'active', 'true')), accent: '#059669' },
    { label: 'Inactive', value: String(statCount(stats, 'active', 'false')), accent: '#059669' },
    { label: 'Types', value: String(statTotal(stats)), accent: '#059669' },
  ];

  const gridContext: EmploymentTypeGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Employment Types"
      subtitle="Full-time, contract, intern and so on"
      entityLabel="employment type"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <EmploymentTypeForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={EMPLOYMENT_TYPE_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search types…"
    />
  );
}

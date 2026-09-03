import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statSum, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useListSalaryStructuresStatsQuery,
  useDeleteSalaryStructureMutation,
  ListSalaryStructuresPagedDocument,
  type ListSalaryStructuresPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { SalaryStructureForm, type SalaryStructureRow } from './forms/salary-structure';
import {
  SALARY_STRUCTURE_COLUMNS,
  type PagedSalaryStructureRow,
  type SalaryStructureGridContext,
} from './salary-structure-grid';

/** Salary Structures — server-paged admin grid over the salary structure records. */
export function SalariesPage() {
  const { data: statsData, refetch: refetchStats } = useListSalaryStructuresStatsQuery();
  const [deleteSalaryStructure] = useDeleteSalaryStructureMutation();
  const { formatDate } = useSettings();

  const crud = useCrudResource<SalaryStructureRow, PagedSalaryStructureRow>({
    label: 'SalaryStructure',
    onDelete: (row) => deleteSalaryStructure({ variables: { id: row.id } }),
    confirmMessage: () => 'Delete this salary structure?',
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListSalaryStructuresPagedDocument,
    (data: ListSalaryStructuresPagedQuery) => data.listSalaryStructuresPaged,
  );

  const stats = statsData?.listSalaryStructuresStats;
  const statItems: StatItem[] = [
    { label: 'Structures', value: String(statTotal(stats)), accent: '#16a34a' },
    { label: 'Total basic', value: statSum(stats, 'basic').toLocaleString(), accent: '#16a34a' },
    { label: 'Total HRA', value: statSum(stats, 'hra').toLocaleString(), accent: '#16a34a' },
    {
      label: 'Total allowances',
      value: statSum(stats, 'allowances').toLocaleString(),
      accent: '#16a34a',
    },
  ];

  const gridContext: SalaryStructureGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Salary Structures"
      subtitle="Each employee’s basic, HRA, allowances and deductions"
      entityLabel="salary structure"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <SalaryStructureForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={SALARY_STRUCTURE_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search by employee id…"
    />
  );
}

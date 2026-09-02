import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useListGradesStatsQuery,
  useDeleteGradeMutation,
  ListGradesPagedDocument,
  type ListGradesPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { GradeForm, type GradeRow } from './forms/grade';
import { GRADE_COLUMNS, type PagedGradeRow, type GradeGridContext } from './grade-grid';

/** Grades — server-paged admin grid over the grade records. */
export function GradesPage() {
  const { data: statsData, refetch: refetchStats } = useListGradesStatsQuery();
  const [deleteGrade] = useDeleteGradeMutation();
  const { formatDate } = useSettings();

  const crud = useCrudResource<GradeRow, PagedGradeRow>({
    label: 'Grade',
    onDelete: (row) => deleteGrade({ variables: { id: row.id } }),
    confirmMessage: () => 'Delete this grade?',
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListGradesPagedDocument,
    (data: ListGradesPagedQuery) => data.listGradesPaged,
  );

  const stats = statsData?.listGradesStats;
  const statItems: StatItem[] = [
    { label: 'Grades', value: String(statTotal(stats)), accent: '#d97706' },
    { label: 'Active', value: String(statCount(stats, 'active', 'true')), accent: '#d97706' },
    { label: 'Inactive', value: String(statCount(stats, 'active', 'false')), accent: '#d97706' },
    { label: 'Grades', value: String(statTotal(stats)), accent: '#d97706' },
  ];

  const gridContext: GradeGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Grades"
      subtitle="Job bands and salary ranges"
      entityLabel="grade"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <GradeForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={GRADE_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search grades…"
    />
  );
}

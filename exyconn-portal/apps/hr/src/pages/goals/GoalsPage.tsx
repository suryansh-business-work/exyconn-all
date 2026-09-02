import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useListGoalsStatsQuery,
  useDeleteGoalMutation,
  ListGoalsPagedDocument,
  type ListGoalsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { GoalForm, type GoalRow } from './forms/goal';
import { GOAL_COLUMNS, type PagedGoalRow, type GoalGridContext } from './goal-grid';

/** Goals — server-paged admin grid over the goal records. */
export function GoalsPage() {
  const { data: statsData, refetch: refetchStats } = useListGoalsStatsQuery();
  const [deleteGoal] = useDeleteGoalMutation();
  const { formatDate } = useSettings();

  const crud = useCrudResource<GoalRow, PagedGoalRow>({
    label: 'Goal',
    onDelete: (row) => deleteGoal({ variables: { id: row.id } }),
    confirmMessage: () => 'Delete this goal?',
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListGoalsPagedDocument,
    (data: ListGoalsPagedQuery) => data.listGoalsPaged,
  );

  const stats = statsData?.listGoalsStats;
  const statItems: StatItem[] = [
    { label: 'Goals', value: String(statTotal(stats)), accent: '#a855f7' },
    { label: 'Active', value: String(statCount(stats, 'status', 'ACTIVE')), accent: '#a855f7' },
    {
      label: 'Completed',
      value: String(statCount(stats, 'status', 'COMPLETED')),
      accent: '#a855f7',
    },
    { label: 'Draft', value: String(statCount(stats, 'status', 'DRAFT')), accent: '#a855f7' },
  ];

  const gridContext: GoalGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Goals"
      subtitle="What each employee is measured on"
      entityLabel="goal"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <GoalForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={GOAL_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search goals…"
    />
  );
}

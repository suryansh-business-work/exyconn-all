import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useListTrainingsStatsQuery,
  useDeleteTrainingMutation,
  ListTrainingsPagedDocument,
  type ListTrainingsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { TrainingForm, type TrainingRow } from './forms/training';
import { TRAINING_COLUMNS, type PagedTrainingRow, type TrainingGridContext } from './training-grid';

/** Learning & Training — server-paged admin grid over the training records. */
export function TrainingPage() {
  const { data: statsData, refetch: refetchStats } = useListTrainingsStatsQuery();
  const [deleteTraining] = useDeleteTrainingMutation();
  const { formatDate } = useSettings();

  const crud = useCrudResource<TrainingRow, PagedTrainingRow>({
    label: 'Training',
    onDelete: (row) => deleteTraining({ variables: { id: row.id } }),
    confirmMessage: () => 'Delete this training?',
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListTrainingsPagedDocument,
    (data: ListTrainingsPagedQuery) => data.listTrainingsPaged,
  );

  const stats = statsData?.listTrainingsStats;
  const statItems: StatItem[] = [
    { label: 'Assigned', value: String(statTotal(stats)), accent: '#6366f1' },
    {
      label: 'In progress',
      value: String(statCount(stats, 'status', 'IN_PROGRESS')),
      accent: '#6366f1',
    },
    {
      label: 'Completed',
      value: String(statCount(stats, 'status', 'COMPLETED')),
      accent: '#6366f1',
    },
    {
      label: 'Not started',
      value: String(statCount(stats, 'status', 'ASSIGNED')),
      accent: '#6366f1',
    },
  ];

  const gridContext: TrainingGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Learning & Training"
      subtitle="Courses assigned to employees"
      entityLabel="training"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <TrainingForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={TRAINING_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search training…"
    />
  );
}

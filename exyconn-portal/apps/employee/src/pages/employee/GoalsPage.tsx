import { Box, LinearProgress, Text } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useMyGoalsQuery, useUpdateMyGoalProgressMutation } from '@exyconn/shell/graphql/generated';
import { GoalProgressControl } from './GoalProgressControl';

type Row = {
  id: string;
  title: string;
  kpi: string;
  weightage: number;
  startDate: string;
  endDate: string;
  progress: number;
  status: string;
  managerComment?: string | null;
};

/** Employee self-service: my goals, and moving my own progress on them. */
export function GoalsPage() {
  const { data, loading, refetch } = useMyGoalsQuery({ fetchPolicy: 'cache-and-network' });
  const [updateProgress] = useUpdateMyGoalProgressMutation();
  const { formatDate } = useSettings();
  const notify = useNotify();
  const rows = (data?.myGoals ?? []) as Row[];

  const setProgress = async (id: string, progress: number) => {
    await updateProgress({ variables: { id, progress } });
    notify('Progress updated.', 'success');
    await refetch();
  };

  const columns: Column<Row>[] = [
    { key: 'title', label: 'Goal', render: (g) => <Text weight="medium">{g.title}</Text> },
    { key: 'kpi', label: 'KPI', render: (g) => g.kpi || '—' },
    { key: 'weightage', label: 'Weight', render: (g) => `${g.weightage}%` },
    {
      key: 'window',
      label: 'Window',
      render: (g) => `${formatDate(g.startDate)} → ${formatDate(g.endDate)}`,
    },
    {
      key: 'progress',
      label: 'Progress',
      render: (g) => (
        <Box sx={{ minWidth: 120 }}>
          <LinearProgress variant="determinate" value={g.progress} sx={{ borderRadius: 1 }} />
          <Text size="caption" color="text.secondary">
            {g.progress}%
          </Text>
        </Box>
      ),
    },
    { key: 'status', label: 'Status', render: (g) => <StatusChip value={g.status} /> },
    {
      key: 'update',
      label: 'Update',
      render: (g) => (
        <GoalProgressControl
          progress={g.progress}
          disabled={g.status === 'COMPLETED' || g.status === 'CANCELLED'}
          onChange={(progress) => setProgress(g.id, progress)}
        />
      ),
    },
    { key: 'managerComment', label: 'Manager', render: (g) => g.managerComment || '—' },
  ];

  return (
    <Box>
      <PageHeader title="Goals" subtitle="What you are measured on this cycle" />
      <Box sx={[glass, { p: { xs: 1, md: 1.5 } }]}>
        <DataTable
          columns={columns}
          rows={rows}
          emptyMessage={loading ? 'Loading…' : 'No goals have been set for you yet.'}
        />
      </Box>
    </Box>
  );
}

import { useState } from 'react';
import CommentIcon from '@mui/icons-material/Comment';
import { Box, Heading, LinearProgress, Text } from '@exyconn/shell/components/ui';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { useTeamGoalsQuery } from '@exyconn/shell/graphql/generated';
import { GoalCommentForm } from '../forms/goal-comment';
import type { TeamGoalRow, TeamSectionProps } from './team.types';

/** The team's goals, with the manager's comment on each. */
export function TeamGoalsSection({ nameOf }: Readonly<TeamSectionProps>) {
  const { data, loading, refetch } = useTeamGoalsQuery({ fetchPolicy: 'cache-and-network' });
  const { formatDate } = useSettings();
  const [commenting, setCommenting] = useState<TeamGoalRow | null>(null);
  const rows = data?.teamGoals ?? [];

  const columns: Column<TeamGoalRow>[] = [
    { key: 'employee', label: 'Employee', render: (r) => nameOf(r.employeeId) },
    { key: 'title', label: 'Goal', render: (r) => <Text weight="medium">{r.title}</Text> },
    { key: 'kpi', label: 'KPI' },
    { key: 'endDate', label: 'Due', render: (r) => formatDate(r.endDate) },
    {
      key: 'progress',
      label: 'Progress',
      render: (r) => (
        <Box sx={{ minWidth: 120 }}>
          <LinearProgress variant="determinate" value={r.progress} />
          <Text size="caption">{r.progress}%</Text>
        </Box>
      ),
    },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
    { key: 'managerComment', label: 'Your comment', render: (r) => r.managerComment ?? '—' },
  ];

  const actions: RowAction<TeamGoalRow>[] = [
    {
      icon: <CommentIcon fontSize="small" />,
      tooltip: 'Comment',
      ariaLabel: 'comment on goal',
      color: 'primary',
      onClick: setCommenting,
    },
  ];

  return (
    <Box sx={[glass, { p: { xs: 1, md: 1.5 } }]}>
      <Heading level={6} sx={{ px: 1, pt: 0.5 }}>
        Goals
      </Heading>
      <DataTable
        columns={columns}
        rows={rows}
        actions={actions}
        emptyMessage="No goals are set for your team."
        loading={loading}
        onRefresh={refetch}
      />
      <CrudDialog
        open={commenting !== null}
        title={commenting ? `Comment on “${commenting.title}”` : ''}
        onClose={() => setCommenting(null)}
      >
        {commenting && (
          <GoalCommentForm
            goal={commenting}
            onCancel={() => setCommenting(null)}
            onDone={async () => {
              setCommenting(null);
              await refetch();
            }}
          />
        )}
      </CrudDialog>
    </Box>
  );
}

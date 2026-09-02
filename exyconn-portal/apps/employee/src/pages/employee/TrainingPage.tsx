import { Box, Link, Text } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  TrainingStatus,
  useMyTrainingsQuery,
  useUpdateMyTrainingStatusMutation,
} from '@exyconn/shell/graphql/generated';
import { TrainingStatusAction } from './TrainingStatusAction';

type Row = {
  id: string;
  title: string;
  provider: string;
  category: string;
  dueOn?: string | null;
  completedOn?: string | null;
  status: TrainingStatus;
  certificateUrl?: string | null;
};

/** Employee self-service: assigned training, and moving it along. */
export function TrainingPage() {
  const { data, loading, refetch } = useMyTrainingsQuery({ fetchPolicy: 'cache-and-network' });
  const [updateStatus] = useUpdateMyTrainingStatusMutation();
  const { formatDate } = useSettings();
  const notify = useNotify();
  const rows = (data?.myTrainings ?? []) as Row[];

  const advance = async (id: string, status: TrainingStatus) => {
    await updateStatus({ variables: { id, status } });
    notify('Training updated.', 'success');
    await refetch();
  };

  const columns: Column<Row>[] = [
    { key: 'title', label: 'Course', render: (t) => <Text weight="medium">{t.title}</Text> },
    { key: 'category', label: 'Category', render: (t) => t.category || '—' },
    { key: 'provider', label: 'Provider', render: (t) => t.provider || '—' },
    { key: 'dueOn', label: 'Due', render: (t) => (t.dueOn ? formatDate(t.dueOn) : '—') },
    { key: 'status', label: 'Status', render: (t) => <StatusChip value={t.status} /> },
    {
      key: 'certificateUrl',
      label: 'Certificate',
      render: (t) =>
        t.certificateUrl ? (
          <Link href={t.certificateUrl} target="_blank" rel="noopener noreferrer">
            Open
          </Link>
        ) : (
          '—'
        ),
    },
    {
      key: 'action',
      label: '',
      render: (t) => <TrainingStatusAction status={t.status} onAdvance={(s) => advance(t.id, s)} />,
    },
  ];

  return (
    <Box>
      <PageHeader title="Learning & Training" subtitle="Courses assigned to you" />
      <Box sx={[glass, { p: { xs: 1, md: 1.5 } }]}>
        <DataTable
          columns={columns}
          rows={rows}
          emptyMessage={loading ? 'Loading…' : 'No training assigned to you yet.'}
        />
      </Box>
    </Box>
  );
}

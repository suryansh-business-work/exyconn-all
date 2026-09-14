import { useT } from '@exyconn/i18n';
import { Box, Link, Text } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';

import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  TrainingStatus,
  useMyTrainingsQuery,
  useUpdateMyTrainingStatusMutation,
} from '@exyconn/shell/graphql/generated';
import { TrainingStatusAction } from './TrainingStatusAction';
import { densePanel } from '@exyconn/shell/components/glass/glass';

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
  const t = useT();
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
    { key: 'title', label: 'Course', render: (row) => <Text weight="medium">{row.title}</Text> },
    { key: 'category', label: 'Category', render: (row) => row.category || '—' },
    { key: 'provider', label: 'Provider', render: (row) => row.provider || '—' },
    { key: 'dueOn', label: 'Due', render: (row) => (row.dueOn ? formatDate(row.dueOn) : '—') },
    { key: 'status', label: 'Status', render: (row) => <StatusChip value={row.status} /> },
    {
      key: 'certificateUrl',
      label: 'Certificate',
      render: (row) =>
        row.certificateUrl ? (
          <Link href={row.certificateUrl} target="_blank" rel="noopener noreferrer">
            {t('Open')}
          </Link>
        ) : (
          '—'
        ),
    },
    {
      key: 'action',
      label: '',
      render: (row) => (
        <TrainingStatusAction status={row.status} onAdvance={(s) => advance(row.id, s)} />
      ),
    },
  ];

  return (
    <Box>
      <PageHeader title="Learning & Training" subtitle="Courses assigned to you" />
      <Box sx={densePanel}>
        <DataTable
          columns={columns}
          rows={rows}
          emptyMessage="No training assigned to you yet."
          loading={loading}
          onRefresh={refetch}
        />
      </Box>
    </Box>
  );
}

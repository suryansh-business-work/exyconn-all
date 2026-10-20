import { useFormatters, useT } from '@exyconn/i18n';
import { Box } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { useMaParticipantsQuery } from '@exyconn/shell/graphql/generated';
import { LoadError } from '../../lib/LoadError';
import { formatSeconds } from '../../lib/format';
import { ParticipantSource } from '../../participants/ParticipantSource';
import {
  firstJoined,
  lastLeft,
  type ParticipantRow,
} from '../../participants/participant-attendance';

/** Who joined this call, for how long, how often they rejoined and how we know. */
export function ParticipantsTab({ meetingId }: Readonly<{ meetingId: string }>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  const { data, loading, error, refetch } = useMaParticipantsQuery({ variables: { meetingId } });
  const when = (value: string | undefined, empty: string) =>
    value ? formatDateTime(value) : t(empty);
  const columns: Column<ParticipantRow>[] = [
    { key: 'displayName', label: 'Name' },
    { key: 'email', label: 'Verified email', render: (row) => row.email ?? t('Not verified') },
    { key: 'joined', label: 'Joined', render: (row) => when(firstJoined(row), 'Not seen') },
    {
      key: 'left',
      label: 'Left',
      render: (row) =>
        firstJoined(row) ? when(lastLeft(row), 'Still in the call') : t('Not seen'),
    },
    {
      key: 'totalSeconds',
      label: 'Time in call',
      render: (row) => formatSeconds(row.totalSeconds),
    },
    { key: 'rejoinCount', label: 'Rejoins', render: (row) => String(row.rejoinCount) },
    { key: 'status', label: 'Status', render: (row) => <StatusChip value={row.status} /> },
    {
      key: 'source',
      label: 'Source',
      render: (row) => <ParticipantSource source={row.source} confidence={row.confidence} />,
    },
  ];

  if (error) {
    return <LoadError message={error.message} onRetry={() => refetch()} />;
  }
  return (
    <Box sx={panel}>
      <DataTable
        columns={columns}
        rows={data?.maParticipants ?? []}
        loading={loading && !data}
        onRefresh={() => refetch()}
        emptyMessage="No participants were recorded for this call."
      />
    </Box>
  );
}

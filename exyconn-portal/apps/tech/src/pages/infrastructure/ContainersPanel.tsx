import { useState } from 'react';
import { NetworkStatus } from '@apollo/client';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Alert, Box, Text } from '@exyconn/shell/components/ui';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { useDockerContainersQuery } from '@exyconn/shell/graphql/generated';
import { ContainerDetailDialog } from './ContainerDetailDialog';
import { formatPort } from './infrastructure.format';

/** How often the container list re-reads the engine, in milliseconds. */
const POLL_MS = 15_000;

type ContainerRow = {
  id: string;
  name: string;
  image: string;
  imageTag: string;
  state: string;
  status: string;
  health: string;
  ipAddress: string;
  ports: { ip: string; privatePort: number; publicPort: number; protocol: string }[];
};

const COLUMNS: Column<ContainerRow>[] = [
  { key: 'name', label: 'Container', render: (row) => <Text weight="medium">{row.name}</Text> },
  { key: 'state', label: 'State', render: (row) => <StatusChip value={row.state} /> },
  { key: 'health', label: 'Health', render: (row) => <StatusChip value={row.health} /> },
  { key: 'status', label: 'Uptime', render: (row) => row.status },
  {
    key: 'imageTag',
    label: 'Deployed tag',
    render: (row) => (
      <Text size="sm" sx={{ wordBreak: 'break-all' }}>
        {row.imageTag}
      </Text>
    ),
  },
  {
    key: 'ports',
    label: 'Ports',
    render: (row) => row.ports.map(formatPort).join(', ') || '—',
  },
  { key: 'ipAddress', label: 'Internal IP', render: (row) => row.ipAddress || '—' },
];

/** The Containers tab: every container on the host, and one click to its full inspect. */
export function ContainersPanel() {
  const { data, loading, error, refetch, networkStatus } = useDockerContainersQuery({
    fetchPolicy: 'cache-and-network',
    pollInterval: POLL_MS,
  });
  const [selected, setSelected] = useState<ContainerRow | null>(null);

  if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }

  const rows = (data?.dockerContainers ?? []) as ContainerRow[];
  const actions: RowAction<ContainerRow>[] = [
    {
      icon: <VisibilityIcon fontSize="small" />,
      tooltip: 'Inspect container',
      ariaLabel: 'inspect',
      onClick: (row) => setSelected(row),
    },
  ];

  return (
    <Box>
      <DataTable
        columns={COLUMNS}
        rows={rows}
        actions={actions}
        onRowClick={(row) => setSelected(row)}
        emptyMessage="No containers on this host."
        loading={loading && networkStatus !== NetworkStatus.poll}
        onRefresh={refetch}
      />
      <ContainerDetailDialog
        containerId={selected?.id ?? null}
        name={selected?.name ?? ''}
        onClose={() => setSelected(null)}
      />
    </Box>
  );
}

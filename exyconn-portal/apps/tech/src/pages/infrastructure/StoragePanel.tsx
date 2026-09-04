import { format } from 'date-fns';
import { Alert, Box, CircularProgress, Grid, Text } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatCard } from '@exyconn/shell/components/dashboard/StatCard';
import { formatBytes } from '@exyconn/shell/utils/file';
import { useDockerStorageQuery } from '@exyconn/shell/graphql/generated';

type ImageRow = {
  id: string;
  repoTags: string[];
  sizeBytes: number;
  createdAt: string;
  containers: number;
};

const COLUMNS: Column<ImageRow>[] = [
  {
    key: 'repoTags',
    label: 'Image',
    render: (row) => (
      <Text size="sm" sx={{ wordBreak: 'break-all' }}>
        {row.repoTags.join(', ') || '<untagged>'}
      </Text>
    ),
  },
  { key: 'sizeBytes', label: 'Size', render: (row) => formatBytes(row.sizeBytes) },
  { key: 'createdAt', label: 'Built', render: (row) => format(new Date(row.createdAt), 'PP') },
  {
    key: 'containers',
    label: 'In use by',
    render: (row) => (row.containers > 0 ? `${row.containers} container(s)` : 'unused'),
  },
];

/** The Storage tab: what the engine's disk is spent on, and every image on the host. */
export function StoragePanel() {
  const { data, loading, error } = useDockerStorageQuery({ fetchPolicy: 'cache-and-network' });

  if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }

  const usage = data?.dockerStorage.usage;
  const rows = (data?.dockerStorage.images ?? []) as ImageRow[];
  const stats = [
    { label: 'Image layers', value: formatBytes(usage?.layersBytes ?? 0), accent: '#4f8cff' },
    {
      label: 'Container writes',
      value: formatBytes(usage?.containersBytes ?? 0),
      accent: '#f9851f',
    },
    { label: 'Volumes', value: formatBytes(usage?.volumesBytes ?? 0), accent: '#7be37b' },
    { label: 'Build cache', value: formatBytes(usage?.buildCacheBytes ?? 0), accent: '#c084fc' },
  ];

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
        {stats.map((stat) => (
          <Grid key={stat.label} item xs={6} md={3}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>
      {loading && rows.length === 0 && <CircularProgress size={24} />}
      <DataTable
        columns={COLUMNS}
        rows={rows}
        emptyMessage={loading ? 'Reading the Docker engine…' : 'No images on this host.'}
      />
    </Box>
  );
}

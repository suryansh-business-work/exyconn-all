import { useMemo } from 'react';
import { format } from 'date-fns';
import { useT } from '@exyconn/i18n';
import { Alert, Box, Grid, Text, color } from '@exyconn/shell/components/ui';
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

type Translate = ReturnType<typeof useT>;

/** How many containers run an image, or that none do. */
function usedByLabel(containers: number, t: Translate): string {
  if (containers === 0) {
    return t('unused');
  }
  if (containers === 1) {
    return t('{count} container', { count: containers });
  }
  return t('{count} containers', { count: containers });
}

/** The Storage tab: what the engine's disk is spent on, and every image on the host. */
export function StoragePanel() {
  const t = useT();
  const columns = useMemo<Column<ImageRow>[]>(
    () => [
      {
        key: 'repoTags',
        label: 'Image',
        render: (row) => (
          <Text size="sm" sx={{ wordBreak: 'break-all' }}>
            {row.repoTags.join(', ') || t('<untagged>')}
          </Text>
        ),
      },
      { key: 'sizeBytes', label: 'Size', render: (row) => formatBytes(row.sizeBytes) },
      { key: 'createdAt', label: 'Built', render: (row) => format(new Date(row.createdAt), 'PP') },
      { key: 'containers', label: 'In use by', render: (row) => usedByLabel(row.containers, t) },
    ],
    [t],
  );
  const { data, loading, error, refetch } = useDockerStorageQuery({
    fetchPolicy: 'cache-and-network',
  });

  if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }

  const usage = data?.dockerStorage.usage;
  const rows = (data?.dockerStorage.images ?? []) as ImageRow[];
  const stats = [
    { label: 'Image layers', value: formatBytes(usage?.layersBytes ?? 0), accent: color.blue[400] },
    {
      label: 'Container writes',
      value: formatBytes(usage?.containersBytes ?? 0),
      accent: color.orange[500],
    },
    { label: 'Volumes', value: formatBytes(usage?.volumesBytes ?? 0), accent: color.green[300] },
    {
      label: 'Build cache',
      value: formatBytes(usage?.buildCacheBytes ?? 0),
      accent: color.purple[300],
    },
  ];

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
        {stats.map((stat) => (
          <Grid
            key={stat.label}
            size={{
              xs: 6,
              md: 3,
            }}
          >
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>
      <DataTable
        columns={columns}
        rows={rows}
        emptyMessage="No images on this host."
        loading={loading}
        onRefresh={refetch}
      />
    </Box>
  );
}

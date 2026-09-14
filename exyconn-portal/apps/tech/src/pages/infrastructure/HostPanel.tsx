import { format } from 'date-fns';
import { useT } from '@exyconn/i18n';
import DnsIcon from '@mui/icons-material/Dns';
import MemoryIcon from '@mui/icons-material/Memory';
import StorageIcon from '@mui/icons-material/Storage';
import { Alert, Box, CircularProgress, Grid, color } from '@exyconn/shell/components/ui';
import { StatCard } from '@exyconn/shell/components/dashboard/StatCard';
import { formatBytes } from '@exyconn/shell/utils/file';
import { useInfrastructureOverviewQuery } from '@exyconn/shell/graphql/generated';
import { InfraDetailCard } from './InfraDetailCard';
import { formatDuration } from './infrastructure.format';

/** Refresh cadence for the live host figures, in milliseconds. */
const POLL_MS = 30_000;

/**
 * The Host tab: the Docker engine and the machine it runs on, this API process, and the
 * MongoDB it is connected to — every value measured when the query runs.
 */
export function HostPanel() {
  const t = useT();
  const { data, loading, error } = useInfrastructureOverviewQuery({
    fetchPolicy: 'cache-and-network',
    pollInterval: POLL_MS,
  });

  if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }
  if (!data) {
    return loading ? <CircularProgress size={24} /> : null;
  }

  const { docker, runtime, database } = data.infrastructureOverview;
  const stats = [
    {
      label: t('Containers running'),
      value: String(docker.containersRunning),
      accent: color.green[300],
    },
    {
      label: t('Containers stopped'),
      value: String(docker.containersStopped),
      accent: color.red[200],
    },
    { label: t('Images on host'), value: String(docker.imagesCount), accent: color.blue[400] },
    { label: t('Host CPUs'), value: String(docker.cpus), accent: color.orange[500] },
  ];

  return (
    <Box>
      {!docker.reachable && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {docker.error}
        </Alert>
      )}
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
      <Grid container spacing={1.5}>
        <Grid
          size={{
            xs: 12,
            md: 4,
          }}
        >
          <InfraDetailCard
            title={t('Docker host')}
            icon={<DnsIcon fontSize="small" />}
            facts={[
              { label: t('Host name'), value: docker.name || '—' },
              { label: t('Engine'), value: docker.serverVersion || '—' },
              { label: t('API version'), value: docker.apiVersion || '—' },
              { label: t('Operating system'), value: docker.operatingSystem || '—' },
              { label: t('Kernel'), value: docker.kernelVersion || '—' },
              { label: t('Architecture'), value: `${docker.osType}/${docker.architecture}` },
              { label: t('CPUs'), value: String(docker.cpus) },
              { label: t('Memory'), value: formatBytes(docker.memoryBytes) },
              { label: t('Storage driver'), value: docker.storageDriver || '—' },
              { label: t('Logging driver'), value: docker.loggingDriver || '—' },
              { label: t('Docker root'), value: docker.dockerRootDir || '—' },
              {
                label: t('Host clock'),
                value: docker.serverTime ? format(new Date(docker.serverTime), 'PPpp') : '—',
              },
            ]}
          />
        </Grid>
        <Grid
          size={{
            xs: 12,
            md: 4,
          }}
        >
          <InfraDetailCard
            title={t('This API process')}
            icon={<MemoryIcon fontSize="small" />}
            facts={[
              { label: t('Container host'), value: runtime.hostname },
              { label: t('Environment'), value: runtime.environment },
              { label: t('Node'), value: runtime.nodeVersion },
              { label: t('Platform'), value: `${runtime.platform}/${runtime.arch}` },
              { label: t('Uptime'), value: formatDuration(runtime.processUptimeSeconds) },
              { label: t('Started'), value: format(new Date(runtime.startedAt), 'PPpp') },
              { label: t('Resident memory'), value: formatBytes(runtime.rssBytes) },
              {
                label: t('Heap'),
                value: `${formatBytes(runtime.heapUsedBytes)} / ${formatBytes(runtime.heapTotalBytes)}`,
              },
              {
                label: t('Load average'),
                value: [runtime.load1, runtime.load5, runtime.load15]
                  .map((value) => value.toFixed(2))
                  .join('  '),
              },
            ]}
          />
        </Grid>
        <Grid
          size={{
            xs: 12,
            md: 4,
          }}
        >
          <InfraDetailCard
            title="MongoDB"
            icon={<StorageIcon fontSize="small" />}
            facts={[
              { label: t('Database'), value: database.name },
              { label: t('Server'), value: database.host || '—' },
              { label: t('Version'), value: database.version || '—' },
              { label: t('Uptime'), value: formatDuration(database.uptimeSeconds) },
              {
                label: t('Connections'),
                value: t('{used} in use / {free} free', {
                  used: database.connectionsCurrent,
                  free: database.connectionsAvailable,
                }),
              },
              { label: t('Collections'), value: String(database.collections) },
              { label: t('Documents'), value: database.objects.toLocaleString() },
              { label: t('Data size'), value: formatBytes(database.dataSizeBytes) },
              { label: t('Storage size'), value: formatBytes(database.storageSizeBytes) },
              { label: t('Index size'), value: formatBytes(database.indexSizeBytes) },
            ]}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

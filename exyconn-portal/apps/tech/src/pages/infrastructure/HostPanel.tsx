import { format } from 'date-fns';
import DnsIcon from '@mui/icons-material/Dns';
import MemoryIcon from '@mui/icons-material/Memory';
import StorageIcon from '@mui/icons-material/Storage';
import { Alert, Box, CircularProgress, Grid } from '@exyconn/shell/components/ui';
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
    { label: 'Containers running', value: String(docker.containersRunning), accent: '#7be37b' },
    { label: 'Containers stopped', value: String(docker.containersStopped), accent: '#ff6b6b' },
    { label: 'Images on host', value: String(docker.imagesCount), accent: '#4f8cff' },
    { label: 'Host CPUs', value: String(docker.cpus), accent: '#f9851f' },
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
          <Grid key={stat.label} item xs={6} md={3}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={1.5}>
        <Grid item xs={12} md={4}>
          <InfraDetailCard
            title="Docker host"
            icon={<DnsIcon fontSize="small" />}
            facts={[
              { label: 'Host name', value: docker.name || '—' },
              { label: 'Engine', value: docker.serverVersion || '—' },
              { label: 'API version', value: docker.apiVersion || '—' },
              { label: 'Operating system', value: docker.operatingSystem || '—' },
              { label: 'Kernel', value: docker.kernelVersion || '—' },
              { label: 'Architecture', value: `${docker.osType}/${docker.architecture}` },
              { label: 'CPUs', value: String(docker.cpus) },
              { label: 'Memory', value: formatBytes(docker.memoryBytes) },
              { label: 'Storage driver', value: docker.storageDriver || '—' },
              { label: 'Logging driver', value: docker.loggingDriver || '—' },
              { label: 'Docker root', value: docker.dockerRootDir || '—' },
              {
                label: 'Host clock',
                value: docker.serverTime ? format(new Date(docker.serverTime), 'PPpp') : '—',
              },
            ]}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <InfraDetailCard
            title="This API process"
            icon={<MemoryIcon fontSize="small" />}
            facts={[
              { label: 'Container host', value: runtime.hostname },
              { label: 'Environment', value: runtime.environment },
              { label: 'Node', value: runtime.nodeVersion },
              { label: 'Platform', value: `${runtime.platform}/${runtime.arch}` },
              { label: 'Uptime', value: formatDuration(runtime.processUptimeSeconds) },
              { label: 'Started', value: format(new Date(runtime.startedAt), 'PPpp') },
              { label: 'Resident memory', value: formatBytes(runtime.rssBytes) },
              {
                label: 'Heap',
                value: `${formatBytes(runtime.heapUsedBytes)} / ${formatBytes(runtime.heapTotalBytes)}`,
              },
              {
                label: 'Load average',
                value: [runtime.load1, runtime.load5, runtime.load15]
                  .map((value) => value.toFixed(2))
                  .join('  '),
              },
            ]}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <InfraDetailCard
            title="MongoDB"
            icon={<StorageIcon fontSize="small" />}
            facts={[
              { label: 'Database', value: database.name },
              { label: 'Server', value: database.host || '—' },
              { label: 'Version', value: database.version || '—' },
              { label: 'Uptime', value: formatDuration(database.uptimeSeconds) },
              {
                label: 'Connections',
                value: `${database.connectionsCurrent} in use / ${database.connectionsAvailable} free`,
              },
              { label: 'Collections', value: String(database.collections) },
              { label: 'Documents', value: database.objects.toLocaleString() },
              { label: 'Data size', value: formatBytes(database.dataSizeBytes) },
              { label: 'Storage size', value: formatBytes(database.storageSizeBytes) },
              { label: 'Index size', value: formatBytes(database.indexSizeBytes) },
            ]}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

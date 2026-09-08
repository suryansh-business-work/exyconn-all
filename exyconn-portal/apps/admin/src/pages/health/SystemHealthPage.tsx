import RefreshIcon from '@mui/icons-material/Refresh';
import { Alert, Box, Button, Grid, LinearProgress } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useSystemHealthQuery, type SystemHealthQuery } from '@exyconn/shell/graphql/generated';
import { HealthFactsCard, type HealthFact } from './HealthFactsCard';
import { HealthJobsCard } from './HealthJobsCard';
import { formatUptime } from './uptime';

type Health = SystemHealthQuery['systemHealth'];

/** The process and the database it is talking to, as one card's worth of facts. */
function runtimeFacts(health: Health): HealthFact[] {
  return [
    { label: 'Server version', value: health.serverVersion },
    { label: 'Node', value: health.nodeVersion },
    { label: 'Uptime', value: formatUptime(health.uptimeSeconds) },
    { label: 'MongoDB', value: health.mongo.ok ? 'Connected' : 'Not connected' },
    { label: 'Database', value: health.mongo.dbName || '—' },
    { label: 'Collections', value: String(health.mongo.collections) },
    { label: 'Data size', value: `${health.mongo.dataSizeMb} MB` },
  ];
}

/**
 * Admin › System Health. Everything on this page is measured when the query runs — the
 * process, the database it is connected to, the four background schedulers and a handful
 * of workload counts — so "Refresh" is the only control it needs.
 */
export function SystemHealthPage() {
  const { formatDateTime } = useSettings();
  const notify = useNotify();
  const { data, loading, error, refetch } = useSystemHealthQuery({ fetchPolicy: 'network-only' });
  const health = data?.systemHealth;

  const refresh = () => {
    refetch().catch((err: unknown) => notify(errorMessage(err, 'Refresh failed'), 'error'));
  };

  return (
    <Box>
      <PageHeader title="System Health" subtitle="This deployment's vital signs">
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={refresh} disabled={loading}>
          Refresh
        </Button>
      </PageHeader>

      {loading && <LinearProgress sx={{ mb: 1.5 }} />}
      {error && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {errorMessage(error, 'System health could not be read.')}
        </Alert>
      )}

      {health && (
        <Grid container spacing={1.5}>
          <Grid item xs={12} md={4}>
            <HealthFactsCard title="Runtime" facts={runtimeFacts(health)} />
          </Grid>
          <Grid item xs={12} md={4}>
            <HealthJobsCard jobs={health.jobs} formatDateTime={formatDateTime} />
          </Grid>
          <Grid item xs={12} md={4}>
            <HealthFactsCard
              title="Workload"
              facts={health.counts.map((count) => ({
                label: count.label,
                value: String(count.value),
              }))}
            />
          </Grid>
        </Grid>
      )}
    </Box>
  );
}

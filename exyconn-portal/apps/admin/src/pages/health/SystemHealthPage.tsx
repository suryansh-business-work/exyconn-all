import RefreshIcon from '@mui/icons-material/Refresh';
import { useT } from '@exyconn/i18n';
import { Alert, Box, Button, Grid, LinearProgress } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useSystemHealthQuery, type SystemHealthQuery } from '@exyconn/shell/graphql/generated';
import { HealthFactsCard, type HealthFact } from './HealthFactsCard';
import { HealthJobsCard } from './HealthJobsCard';
import { HealthBackupCard } from './HealthBackupCard';
import { formatUptime } from './uptime';

type Health = SystemHealthQuery['systemHealth'];

/** Translates one source string; the page's `useT` is handed to the module-scope builders. */
type Translate = (source: string, values?: Record<string, string | number>) => string;

/** The process and the database it is talking to, as one card's worth of facts. */
function runtimeFacts(health: Health, t: Translate): HealthFact[] {
  return [
    { label: t('Server version'), value: health.serverVersion },
    { label: t('Node'), value: health.nodeVersion },
    { label: t('Uptime'), value: formatUptime(health.uptimeSeconds) },
    { label: t('MongoDB'), value: health.mongo.ok ? t('Connected') : t('Not connected') },
    { label: t('Database'), value: health.mongo.dbName || '—' },
    { label: t('Collections'), value: String(health.mongo.collections) },
    { label: t('Data size'), value: t('{size} MB', { size: health.mongo.dataSizeMb }) },
  ];
}

/**
 * Admin › System Health. Everything on this page is measured when the query runs — the
 * process, the database it is connected to, the four background schedulers and a handful
 * of workload counts — so "Refresh" is the only control it needs.
 */
export function SystemHealthPage() {
  const t = useT();
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
          {t('Refresh')}
        </Button>
      </PageHeader>

      {loading && <LinearProgress sx={{ mb: 1.5 }} />}
      {error && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {errorMessage(error, t('System health could not be read.'))}
        </Alert>
      )}

      {health && (
        <Grid container spacing={1.5}>
          <Grid
            size={{
              xs: 12,
              md: 4,
            }}
          >
            <HealthFactsCard title={t('Runtime')} facts={runtimeFacts(health, t)} />
          </Grid>
          <Grid
            size={{
              xs: 12,
              md: 4,
            }}
          >
            <HealthJobsCard jobs={health.jobs} formatDateTime={formatDateTime} />
          </Grid>
          <Grid
            size={{
              xs: 12,
              md: 4,
            }}
          >
            <HealthFactsCard
              title={t('Workload')}
              facts={health.counts.map((count) => ({
                label: count.label,
                value: String(count.value),
              }))}
            />
          </Grid>
          <Grid
            size={{
              xs: 12,
              md: 4,
            }}
          >
            <HealthBackupCard backup={health.backup} formatDateTime={formatDateTime} />
          </Grid>
        </Grid>
      )}
    </Box>
  );
}

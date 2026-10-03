import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
  Alert,
  Box,
  Button,
  Grid,
  LinearProgress,
  Stack,
  Text,
} from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { SonarOverviewState, useSonarOverviewQuery } from '@exyconn/shell/graphql/generated';
import { QualityGateBanner } from './QualityGateBanner';
import { SonarMetricGrid } from './SonarMetricGrid';
import { RecentAnalyses } from './RecentAnalyses';
import { SonarIssuesTable } from './SonarIssuesTable';
import { SonarProblemState } from './SonarProblemState';
import type { SonarOverviewData } from './sonar.types';

/** The dashboard for a project SonarQube answered for. */
function SonarDashboard({ overview }: Readonly<{ overview: SonarOverviewData }>) {
  const t = useT();
  const { formatDateTime } = useSettings();
  return (
    <>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 1.5 }}
      >
        <Text size="sm" color="text.secondary">
          {t('{project} on {config}, read {time}', {
            project: overview.projectKey,
            config: overview.configLabel,
            time: formatDateTime(overview.checkedAt),
          })}
        </Text>
        <Button
          href={overview.projectUrl}
          target="_blank"
          rel="noopener noreferrer"
          size="small"
          endIcon={<OpenInNewIcon fontSize="small" />}
        >
          {t('Open in SonarQube')}
        </Button>
      </Stack>
      {overview.qualityGate && <QualityGateBanner gate={overview.qualityGate} />}
      {overview.metrics && <SonarMetricGrid metrics={overview.metrics} />}
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <SonarIssuesTable overview={overview} />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <RecentAnalyses analyses={overview.analyses} />
        </Grid>
      </Grid>
    </>
  );
}

/**
 * Tech › Security › SonarQube: the active SonarQube project's quality gate, measures, recent
 * analyses and worst open issues. The server caches the read for five minutes; Refresh asks
 * SonarQube again.
 */
export function SonarPage() {
  const t = useT();
  const notify = useNotify();
  const { data, loading, error, refetch } = useSonarOverviewQuery({
    fetchPolicy: 'cache-and-network',
  });
  const [refreshing, setRefreshing] = useState(false);
  const overview = data?.sonarOverview;

  const refresh = async () => {
    setRefreshing(true);
    try {
      await refetch({ refresh: true });
    } catch (err) {
      notify(errorMessage(err, t('SonarQube could not be read.')), 'error');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="SonarQube"
        subtitle="Code quality and security findings from the project's latest analysis"
      >
        <Button variant="outlined" onClick={refresh} disabled={refreshing || !data}>
          {refreshing ? t('Reading…') : t('Refresh')}
        </Button>
      </PageHeader>

      {(refreshing || (!data && loading)) && (
        <LinearProgress sx={{ mb: 1.5 }} aria-label={t('Reading SonarQube')} />
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {errorMessage(error, t('SonarQube could not be read.'))}
        </Alert>
      )}
      {overview?.state === SonarOverviewState.Ok && <SonarDashboard overview={overview} />}
      {overview && overview.state !== SonarOverviewState.Ok && (
        <SonarProblemState state={overview.state} message={overview.message} />
      )}
    </Box>
  );
}

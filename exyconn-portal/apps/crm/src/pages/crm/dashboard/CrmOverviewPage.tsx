import { useSearchParams } from 'react-router-dom';
import { useI18n, useT } from '@exyconn/i18n';
import { Alert, Box, Button } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { DashboardSkeleton } from '@exyconn/shell/components/feedback/skeletons';
import { EmptyState } from '@exyconn/shell/components/feedback/EmptyState';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useCrmDashboardQuery } from '@exyconn/shell/graphql/generated';
import { periodRange, readPeriod } from './period';
import { PeriodSelector } from './PeriodSelector';
import { DashboardBody } from './DashboardBody';

/** CRM › Overview: the pipeline, what was won, where leads come from and what needs doing. */
export function CrmOverviewPage() {
  const t = useT();
  const { timezone } = useI18n().settings;
  const [params] = useSearchParams();
  const period = readPeriod(params);
  // Whole periods (this month, a custom pair of days), so the same instants every render.
  const range = periodRange(period, new Date(), timezone);
  const { data, loading, error, refetch } = useCrmDashboardQuery({
    variables: { from: range?.from.toISOString() ?? '', to: range?.to.toISOString() ?? '' },
    skip: !range,
    fetchPolicy: 'cache-and-network',
  });
  const dashboard = data?.crmDashboard;
  const retry = () => {
    refetch().catch((reason: unknown) =>
      portalLogger.warn('crm: reloading the dashboard failed', reason),
    );
  };

  return (
    <Box>
      <PageHeader title="CRM" subtitle="Pipeline, wins and what needs doing">
        <PeriodSelector period={period} />
      </PageHeader>
      {!range && (
        <EmptyState
          title="Pick a start and an end day"
          description="A custom period needs both days, the end on or after the start."
        />
      )}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 1.5 }}
          action={
            <Button color="inherit" size="small" onClick={retry}>
              {t('Retry')}
            </Button>
          }
        >
          {errorMessage(error, t('Could not load the CRM dashboard.'))}
        </Alert>
      )}
      {range && !dashboard && loading && (
        <DashboardSkeleton tiles={8} charts={6} label="Loading the CRM dashboard" />
      )}
      {range && dashboard && <DashboardBody dashboard={dashboard} />}
    </Box>
  );
}

import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFormatters } from '@exyconn/i18n';
import { Box } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { StatRow } from '@exyconn/shell/components/dashboard/StatRow';
import { MetricChart } from '@exyconn/shell/components/dashboard/MetricChart';
import { useMaDashboardQuery } from '@exyconn/shell/graphql/generated';
import { LoadError } from '../lib/LoadError';
import { PageLinks } from '../lib/PageLinks';
import { meetingPaths, type MeetingPageProps } from '../lib/scope';
import { DashboardFilters } from './DashboardFilters';
import { toDashboardFilter } from './dashboard-filter';
import { dashboardStats } from './dashboard-stats';
import { BotTrips } from '../bot/BotTrips';

/**
 * Meeting Assistant → Dashboard: how many calls were recorded, how long they ran, what the AI
 * wrote up and what is still to do — for the viewer's own meetings or the whole company's.
 */
export function MeetingDashboardPage({ scope, basePath }: Readonly<MeetingPageProps>) {
  const { formatNumber, formatDate } = useFormatters();
  const [params] = useSearchParams();
  const filter = useMemo(() => toDashboardFilter(params, scope), [params, scope]);
  const { data, loading, error, refetch } = useMaDashboardQuery({
    variables: { filter },
    fetchPolicy: 'cache-and-network',
  });
  const dashboard = data?.maDashboard;
  const paths = meetingPaths(basePath);
  const byDay = (dashboard?.byDay ?? []).map((day) => ({
    label: formatDate(day.value),
    value: day.count,
  }));

  return (
    <>
      <PageHeader
        title={scope === 'ALL' ? 'Meeting Assistant' : 'My meetings'}
        subtitle="Google Meet calls, AI notes and the actions they produced"
      />
      <PageLinks
        links={[
          { label: 'Open meetings', to: paths.list },
          { label: 'Open action checklist', to: paths.actions },
          { label: 'Chrome extension', to: paths.extension },
        ]}
      />
      <DashboardFilters scope={scope} />
      {error && (
        <Box sx={{ mb: 2 }}>
          <LoadError message={error.message} onRetry={() => refetch()} />
        </Box>
      )}
      <StatRow stats={dashboardStats(dashboard, formatNumber)} loading={!dashboard && loading} />
      <Box sx={{ mt: 2 }}>
        <MetricChart
          title="Meetings per day"
          metrics={byDay}
          formatValue={(value) => formatNumber(value)}
          labelHeading="Day"
          integer
        />
      </Box>
      <Box sx={{ mt: 2 }}>
        <BotTrips scope={scope} basePath={basePath} />
      </Box>
    </>
  );
}

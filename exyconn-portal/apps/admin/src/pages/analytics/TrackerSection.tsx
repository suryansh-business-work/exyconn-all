import { useT } from '@exyconn/i18n';
import { Grid, color } from '@exyconn/shell/components/ui';
import { MetricChart } from '@exyconn/shell/components/dashboard/MetricChart';
import { StatRow } from '@exyconn/shell/components/dashboard/StatRow';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import type { WorkspaceAnalyticsQuery } from '@exyconn/shell/graphql/generated';
import { AnalyticsSection } from './AnalyticsSection';
import { PointChart } from '@exyconn/shell/components/dashboard/PointChart';
import { count, hours, percent, withPlatformNames } from './analytics.format';

type Tracker = WorkspaceAnalyticsQuery['workspaceAnalytics']['tracker'];

/** Who may use the tracker, on how many devices — as of now. */
function accessTiles(tracker: Tracker): StatItem[] {
  return [
    { label: 'Tracker access', value: count(tracker.usersWithAccess), accent: color.blue[400] },
    { label: 'Consented', value: count(tracker.consented), accent: color.green[500] },
    { label: 'Active devices', value: count(tracker.activeDevices), accent: color.cyan[600] },
    { label: 'Tracked people', value: count(tracker.trackedUsers), accent: color.violet[400] },
  ];
}

/** What the tracker recorded in the period. */
function timeTiles(tracker: Tracker): StatItem[] {
  return [
    { label: 'Active hours', value: hours(tracker.activeHours), accent: color.green[500] },
    { label: 'Idle hours', value: hours(tracker.idleHours), accent: color.amber[500] },
    { label: 'Activity', value: percent(tracker.activityPercent), accent: color.cyan[600] },
    { label: 'Sessions', value: count(tracker.sessions), accent: color.blue[400] },
  ];
}

/** The desktop and phone tracker: access, devices, and the time it recorded in the period. */
export function TrackerSection({ tracker }: Readonly<{ tracker: Tracker }>) {
  const t = useT();
  const { formatDate } = useSettings();
  const breakdowns = [
    {
      title: 'Devices by platform',
      metrics: withPlatformNames(tracker.devicesByPlatform),
      heading: 'Platform',
    },
    { title: 'Status right now', metrics: tracker.presence, heading: 'Status' },
    {
      title: 'Manual time entries',
      metrics: tracker.manualEntriesByStatus,
      heading: 'Status',
    },
  ];
  return (
    <AnalyticsSection
      title="Employee tracker"
      subtitle="Tracker access and devices today; hours, people and apps over the period"
    >
      <StatRow stats={accessTiles(tracker)} />
      <StatRow stats={timeTiles(tracker)} />
      <PointChart
        title="Active hours per day"
        points={tracker.hoursPerDay}
        formatValue={hours}
        formatPeriod={formatDate}
        labelHeading="Day"
      />
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, md: 6 }}>
          <MetricChart
            title="Most active people"
            subtitle={t('Active hours in the period')}
            metrics={tracker.topUsers}
            formatValue={hours}
            labelHeading="Person"
            horizontal
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <MetricChart
            title="Top applications"
            subtitle={t('Hours spent in each app in the period')}
            metrics={tracker.topApps}
            formatValue={hours}
            labelHeading="Application"
            horizontal
          />
        </Grid>
        {breakdowns.map((chart) => (
          <Grid key={chart.title} size={{ xs: 12, md: 4 }}>
            <MetricChart
              title={chart.title}
              metrics={chart.metrics}
              formatValue={count}
              labelHeading={chart.heading}
              integer
            />
          </Grid>
        ))}
      </Grid>
    </AnalyticsSection>
  );
}

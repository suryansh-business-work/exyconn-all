import { useT } from '@exyconn/i18n';
import { Grid, color } from '@exyconn/shell/components/ui';
import { MetricChart } from '@exyconn/shell/components/dashboard/MetricChart';
import { StatRow } from '@exyconn/shell/components/dashboard/StatRow';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import type { WorkspaceAnalyticsQuery } from '@exyconn/shell/graphql/generated';
import { AnalyticsSection } from './AnalyticsSection';
import { PointChart } from './PointChart';
import { count } from './analytics.format';

type Users = WorkspaceAnalyticsQuery['workspaceAnalytics']['users'];

function tilesOf(users: Users): StatItem[] {
  return [
    { label: 'Users', value: count(users.total), accent: color.blue[400] },
    { label: 'Active', value: count(users.active), accent: color.green[500] },
    { label: 'Online now', value: count(users.onlineNow), accent: color.cyan[600] },
    { label: 'Inactive', value: count(users.inactive), accent: color.amber[500] },
    { label: 'Blocked', value: count(users.blocked), accent: color.red[500] },
    { label: 'Joined in period', value: count(users.joined), accent: color.violet[400] },
  ];
}

/** Every account in the company: who can sign in, who is online, and who holds which role. */
export function UsersSection({ users }: Readonly<{ users: Users }>) {
  const t = useT();
  const { formatDate } = useSettings();
  return (
    <AnalyticsSection
      title="Users"
      subtitle="Every account in the company, and the roles they hold"
    >
      <StatRow stats={tilesOf(users)} />
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, md: 5 }}>
          <MetricChart
            title="Users by role"
            subtitle={t('Someone with several roles counts under each')}
            metrics={users.byRole}
            formatValue={count}
            labelHeading="Role"
            horizontal
            integer
          />
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <PointChart
            title="Users joined per day"
            points={users.joinedPerDay}
            formatValue={count}
            formatPeriod={formatDate}
            labelHeading="Day"
            integer
          />
        </Grid>
      </Grid>
    </AnalyticsSection>
  );
}

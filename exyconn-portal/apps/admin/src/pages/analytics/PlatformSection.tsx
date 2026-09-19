import { useT } from '@exyconn/i18n';
import { Grid, Text, color } from '@exyconn/shell/components/ui';
import { MetricChart } from '@exyconn/shell/components/dashboard/MetricChart';
import { StatRow } from '@exyconn/shell/components/dashboard/StatRow';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import {
  usePlatformAnalyticsQuery,
  type PlatformAnalyticsQuery,
} from '@exyconn/shell/graphql/generated';
import { AnalyticsSection } from './AnalyticsSection';
import { PointChart } from '@exyconn/shell/components/dashboard/PointChart';
import { count, withCountryNames } from './analytics.format';

type Platform = PlatformAnalyticsQuery['platformAnalytics'];

/** Months are `YYYY-MM` keys; they read fine as they are. */
const asMonth = (period: string) => period;

function tilesOf(platform: Platform): StatItem[] {
  return [
    { label: 'Organizations', value: count(platform.organizations), accent: color.blue[400] },
    { label: 'Active', value: count(platform.activeOrganizations), accent: color.green[500] },
    { label: 'Users', value: count(platform.users), accent: color.cyan[600] },
    { label: 'Employees', value: count(platform.employees), accent: color.violet[400] },
  ];
}

/** SUPER_ADMIN only: every organization on the platform, how big, and where. */
export function PlatformSection() {
  const t = useT();
  const { data, error } = usePlatformAnalyticsQuery({ fetchPolicy: 'cache-and-network' });
  const platform = data?.platformAnalytics;
  return (
    <AnalyticsSection title="Platform" subtitle="Every organization on the platform, as of now">
      {error && <Text color="error">{error.message}</Text>}
      {platform && (
        <>
          <StatRow stats={tilesOf(platform)} />
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, md: 6 }}>
              <MetricChart
                title="Largest organizations"
                subtitle={t('User accounts in each')}
                metrics={platform.usersByOrganization}
                formatValue={count}
                labelHeading="Organization"
                horizontal
                integer
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <PointChart
                title="Organizations created per month"
                points={platform.organizationsPerMonth}
                formatValue={count}
                formatPeriod={asMonth}
                labelHeading="Month"
                integer
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <MetricChart
                title="Organizations by status"
                metrics={platform.organizationsByStatus}
                formatValue={count}
                labelHeading="Status"
                integer
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <MetricChart
                title="Organizations by country"
                metrics={withCountryNames(platform.organizationsByCountry, t('Not set'))}
                formatValue={count}
                labelHeading="Country"
                horizontal
                integer
              />
            </Grid>
          </Grid>
        </>
      )}
    </AnalyticsSection>
  );
}

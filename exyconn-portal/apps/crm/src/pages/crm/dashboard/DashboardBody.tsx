import { useT } from '@exyconn/i18n';
import { Grid, Stack } from '@exyconn/shell/components/ui';
import { StatRow } from '@exyconn/shell/components/dashboard/StatRow';
import { MetricChart } from '@exyconn/shell/components/dashboard/MetricChart';
import { formatMoney } from '@exyconn/shell/utils/money';
import { CrmDashboardGranularity, type CrmDashboardQuery } from '@exyconn/shell/graphql/generated';
import { dashboardTiles } from './dashboard.tiles';
import { InsightsList } from './InsightsList';
import { ActivityChart, WonTrendChart } from './TimeCharts';
import { usePeriodLabels } from './usePeriodLabels';

const count = (value: number): string => Math.round(value).toLocaleString();
const money = (value: number): string => formatMoney(value);

const PERIOD_HEADING: Readonly<Record<CrmDashboardGranularity, string>> = {
  [CrmDashboardGranularity.Day]: 'Day',
  [CrmDashboardGranularity.Week]: 'Week',
  [CrmDashboardGranularity.Month]: 'Month',
};

/**
 * The loaded overview: tiles, then the charts and findings. One column on a phone, two on a
 * tablet and the insights beside the pipeline on a desktop.
 */
export function DashboardBody({
  dashboard,
}: Readonly<{ dashboard: CrmDashboardQuery['crmDashboard'] }>) {
  const t = useT();
  const labelOf = usePeriodLabels(dashboard.granularity, dashboard.timezone);
  const periodHeading = t(PERIOD_HEADING[dashboard.granularity]);
  return (
    <Stack spacing={1.5}>
      <StatRow stats={dashboardTiles(dashboard.kpis)} />
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, md: 7 }}>
          <MetricChart
            title="Open pipeline by stage"
            subtitle={t('Value of open deals in each stage, as of now')}
            metrics={dashboard.pipelineByStage.map((row) => ({
              label: row.stage,
              value: row.value,
            }))}
            formatValue={money}
            labelHeading="Stage"
            horizontal
          />
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <InsightsList insights={dashboard.insights} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <WonTrendChart
            points={dashboard.wonOverTime}
            labelOf={labelOf}
            periodHeading={periodHeading}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <MetricChart
            title="Leads by source"
            subtitle={t('New leads in this period')}
            metrics={dashboard.leadsBySource.map((row) => ({
              label: row.source,
              value: row.count,
            }))}
            formatValue={count}
            labelHeading="Source"
            horizontal
            integer
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ActivityChart
            points={dashboard.activitiesOverTime}
            labelOf={labelOf}
            periodHeading={periodHeading}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <MetricChart
            title="Top owners by won value"
            metrics={dashboard.topOwners.map((row) => ({ label: row.owner, value: row.value }))}
            formatValue={money}
            labelHeading="Owner"
            horizontal
          />
        </Grid>
      </Grid>
    </Stack>
  );
}

import { useT } from '@exyconn/i18n';
import { Grid, color } from '@exyconn/shell/components/ui';
import { MetricChart, type Metric } from '@exyconn/shell/components/dashboard/MetricChart';
import { StatRow } from '@exyconn/shell/components/dashboard/StatRow';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import type { WorkspaceAnalyticsQuery } from '@exyconn/shell/graphql/generated';
import { AnalyticsSection } from './AnalyticsSection';
import { count, withCountryNames } from './analytics.format';

type Employees = WorkspaceAnalyticsQuery['workspaceAnalytics']['employees'];

/** The count in one group of a breakdown, 0 when nobody is in it. */
const valueOf = (metrics: readonly Metric[], label: string) =>
  metrics.find((metric) => metric.label === label)?.value ?? 0;

function tilesOf(employees: Employees): StatItem[] {
  return [
    { label: 'Employees', value: count(employees.total), accent: color.blue[400] },
    {
      label: 'Active employees',
      value: count(valueOf(employees.byStatus, 'ACTIVE')),
      accent: color.green[500],
    },
    {
      label: 'Departments',
      value: count(employees.byDepartment.length),
      accent: color.violet[400],
    },
    { label: 'Countries', value: count(employees.byCountry.length), accent: color.cyan[600] },
  ];
}

/** The people holding the EMPLOYEE role, broken down the ways HR files them. */
export function EmployeesSection({ employees }: Readonly<{ employees: Employees }>) {
  const t = useT();
  const charts = [
    { title: 'Employees by status', metrics: employees.byStatus, heading: 'Status' },
    { title: 'Employees by department', metrics: employees.byDepartment, heading: 'Department' },
    { title: 'Employees by work location', metrics: employees.byWorkLocation, heading: 'Location' },
    {
      title: 'Employees by country',
      metrics: withCountryNames(employees.byCountry, t("Company's country")),
      heading: 'Country',
    },
  ];
  return (
    <AnalyticsSection
      title="Employees"
      subtitle="People holding the Employee role, as HR files them"
    >
      <StatRow stats={tilesOf(employees)} />
      <Grid container spacing={1.5}>
        {charts.map((chart) => (
          <Grid key={chart.title} size={{ xs: 12, md: 6 }}>
            <MetricChart
              title={chart.title}
              metrics={chart.metrics}
              formatValue={count}
              labelHeading={chart.heading}
              horizontal
              integer
            />
          </Grid>
        ))}
      </Grid>
    </AnalyticsSection>
  );
}

import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import {
  Box,
  Grid,
  Stack,
  Text,
  ToggleButton,
  ToggleButtonGroup,
  color,
} from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { useItReportQuery, type ItReportQuery } from '@exyconn/shell/graphql/generated';
import { MetricChart } from '@exyconn/shell/components/dashboard/MetricChart';
import { StatRow } from '@exyconn/shell/components/dashboard/StatRow';
import { TicketTrendChart } from './TicketTrendChart';

/** The periods a report can cover, in months. */
const PERIODS = [3, 6, 12] as const;

const count = (value: number): string => Math.round(value).toLocaleString();
const hours = (value: number): string => `${value.toFixed(1)}h`;

/** Share of each category's in-service devices that are in someone's hands. */
function utilization(report: ItReportQuery['itReport']) {
  return report.assetUtilization.map((row) => ({
    label: row.category,
    value: row.total === 0 ? 0 : Math.round((row.assigned / row.total) * 100),
  }));
}

/** The headline numbers: the SLA, how long tickets take, what is late, how long incidents last. */
function tilesOf(report: ItReportQuery['itReport']): StatItem[] {
  return [
    { label: 'SLA met', value: `${Math.round(report.slaMetPercent)}%`, accent: color.green[500] },
    { label: 'Avg resolution', value: hours(report.avgResolutionHours), accent: color.cyan[600] },
    { label: 'Breached, still open', value: count(report.breachedOpen), accent: color.red[500] },
    { label: 'Incident MTTR', value: hours(report.mttrHours), accent: color.amber[500] },
  ];
}

/** IT › Reports & Analytics: ticket SLA and resolution, asset use, incidents and spend. */
export function ReportsPage() {
  const t = useT();
  const { formatCurrency } = useSettings();
  const [months, setMonths] = useState<number>(6);
  const { data, error } = useItReportQuery({
    variables: { months },
    fetchPolicy: 'cache-and-network',
  });
  const report = data?.itReport;

  return (
    <Box>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Ticket SLA, resolution time, asset use, incidents and IT spend"
      >
        <ToggleButtonGroup
          exclusive
          size="small"
          value={months}
          aria-label={t('Report period')}
          onChange={(_event, next: number | null) => {
            if (next) {
              setMonths(next);
            }
          }}
        >
          {PERIODS.map((period) => (
            <ToggleButton key={period} value={period}>
              {t('{count} months', { count: period })}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </PageHeader>
      {error && <Text color="error">{error.message}</Text>}
      {report && (
        <Stack spacing={1.5}>
          <StatRow stats={tilesOf(report)} />
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, md: 8 }}>
              <TicketTrendChart points={report.ticketTrend} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <MetricChart
                title="Tickets by status"
                metrics={report.ticketsByStatus}
                formatValue={count}
                labelHeading="Status"
                horizontal
                integer
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <MetricChart
                title="Asset utilisation"
                subtitle={t('Share of in-service devices assigned')}
                metrics={utilization(report)}
                formatValue={(value) => `${value}%`}
                labelHeading="Category"
                horizontal
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <MetricChart
                title="Incidents by severity"
                metrics={report.incidentsBySeverity}
                formatValue={count}
                labelHeading="Severity"
                integer
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <MetricChart
                title="Incidents per month"
                metrics={report.incidentsByMonth}
                formatValue={count}
                labelHeading="Month"
                integer
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <MetricChart
                title="IT spend"
                metrics={report.spend.byCategory}
                formatValue={(value) => formatCurrency(value)}
                labelHeading="Category"
                horizontal
              />
            </Grid>
          </Grid>
        </Stack>
      )}
    </Box>
  );
}

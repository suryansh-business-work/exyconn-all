import { useMemo } from 'react';
// Through the shell's barrel, like every other portal UI import: the app declares
// @exyconn/shell, not @exyconn/ui, and the deploy image installs only what is declared.
import { BarChart, Box, ChartCard, type ChartData } from '@exyconn/shell/components/ui';
import { glass } from '@exyconn/shell/components/glass/glass';

/** One priced thing — an employee or a project — as the chart reads it. */
export interface BillingBar {
  id: string;
  name: string;
  hours: number;
}

interface TrackerBillingChartProps {
  rows: readonly BillingBar[];
  title: string;
  subtitle: string;
  /** "Employee" or "Project" — the table twin's first column. */
  labelHeading: string;
}

/** How many bars get their own row before the tail is folded into "Other". */
const LIMIT = 10;

/**
 * Billable hours, biggest first.
 *
 * One series, one colour: these are names, not an ordered scale, and shading each bar by its
 * own value would re-encode the bar length in colour and say nothing new. Horizontal, because
 * employee and project names are long and a rotated label is one nobody reads.
 */
export function TrackerBillingChart({
  rows,
  title,
  subtitle,
  labelHeading,
}: Readonly<TrackerBillingChartProps>) {
  const data = useMemo<ChartData>(() => {
    const ranked = [...rows].filter((row) => row.hours > 0).sort((a, b) => b.hours - a.hours);
    const top = ranked.slice(0, LIMIT);
    const restHours = ranked.slice(LIMIT).reduce((total, row) => total + row.hours, 0);

    const labels = top.map((row) => row.name);
    const values = top.map((row) => Math.round(row.hours * 10) / 10);
    if (restHours > 0) {
      labels.push('Other');
      values.push(Math.round(restHours * 10) / 10);
    }
    return { labels, series: [{ id: 'hours', label: 'Hours', values }] };
  }, [rows]);

  const height = Math.max(160, data.labels.length * 28 + 60);

  return (
    <Box sx={[glass, { p: 2, mb: 2 }]}>
      <ChartCard
        title={title}
        subtitle={subtitle}
        data={data}
        formatValue={(hours) => `${hours}h`}
        labelHeading={labelHeading}
        emptyText="No billable hours in this period."
      >
        <BarChart data={data} formatValue={(hours) => `${hours}h`} horizontal height={height} />
      </ChartCard>
    </Box>
  );
}

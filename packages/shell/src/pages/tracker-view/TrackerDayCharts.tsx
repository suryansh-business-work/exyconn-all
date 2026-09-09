import { useMemo } from 'react';
import { Box, Divider } from '@/components/ui';
import { BarChart, ChartCard, useChartPalette } from '@exyconn/ui';
import { appUsageChart, dayByHourChart, formatHours, projectSplitChart } from './tracker.charts';
import type { TrackerDayData } from './tracker.types';

interface TrackerDayChartsProps {
  day: TrackerDayData | undefined;
  /** The zone the day is read in — it decides which hour each interval falls in. */
  timezone: string;
}

/**
 * The selected day, in three readings: when the work happened, which applications it happened
 * in, and which projects it was booked to.
 *
 * All three are the same day sliced differently, so they sit together and share the day the
 * calendar has selected — never their own filters.
 */
export function TrackerDayCharts({ day, timezone }: Readonly<TrackerDayChartsProps>) {
  const palette = useChartPalette();
  const hours = useMemo(() => {
    const shaped = dayByHourChart(day, timezone);
    const colors = [palette.series[0], palette.series[3]];
    return {
      ...shaped,
      series: shaped.series.map((series, index) => ({ ...series, color: colors[index] })),
    };
  }, [day, timezone, palette]);

  const apps = useMemo(() => appUsageChart(day?.appUsage ?? []), [day]);
  const projects = useMemo(() => projectSplitChart(day), [day]);

  return (
    <Box>
      <ChartCard
        title="When the work happened"
        subtitle="Worked and idle time by hour of the day"
        data={hours}
        formatValue={formatHours}
        labelHeading="Hour"
        emptyText="No activity recorded on this day."
      >
        <BarChart data={hours} formatValue={formatHours} stacked height={200} />
      </ChartCard>

      <Divider sx={{ my: 2 }} />

      <ChartCard
        title="Top applications"
        subtitle="Time in the foreground"
        data={apps}
        formatValue={formatHours}
        labelHeading="Application"
        emptyText="No app usage recorded."
      >
        {/* Horizontal: application names are long, and a rotated label is a label nobody reads. */}
        <BarChart data={apps} formatValue={formatHours} horizontal height={200} />
      </ChartCard>

      <Divider sx={{ my: 2 }} />

      <ChartCard
        title="Where the time was booked"
        subtitle="Worked hours per project"
        data={projects}
        formatValue={formatHours}
        labelHeading="Project"
        emptyText="No sessions on this day."
      >
        <BarChart data={projects} formatValue={formatHours} horizontal height={160} />
      </ChartCard>
    </Box>
  );
}

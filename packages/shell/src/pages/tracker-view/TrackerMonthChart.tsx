import { useMemo } from 'react';
import { BarChart, ChartCard, useChartPalette } from '@exyconn/ui';
import { formatHours, monthHoursChart } from './tracker.charts';
import type { TrackerDayBucketData } from './tracker.types';

interface TrackerMonthChartProps {
  buckets: readonly TrackerDayBucketData[];
  monthLabel: string;
}

/**
 * The month as a stacked column per day: worked, idle, and approved off-computer time.
 *
 * The calendar beside it answers "which days"; this answers "how much, and how solid" — a day
 * that is mostly idle and a day that is mostly worked look identical on a calendar heatmap and
 * completely different here.
 */
export function TrackerMonthChart({ buckets, monthLabel }: Readonly<TrackerMonthChartProps>) {
  const palette = useChartPalette();
  const data = useMemo(() => {
    const shaped = monthHoursChart(buckets);
    // Worked / idle / off-computer MEAN something, so they hold fixed slots wherever they
    // appear in the tracker rather than taking whatever colour their position would give them.
    const colors = [palette.series[0], palette.series[3], palette.series[6]];
    return {
      ...shaped,
      series: shaped.series.map((series, index) => ({ ...series, color: colors[index] })),
    };
  }, [buckets, palette]);

  return (
    <ChartCard
      title="Hours this month"
      subtitle={`${monthLabel} · each column is one day`}
      data={data}
      formatValue={formatHours}
      labelHeading="Day"
      emptyText="No time tracked this month."
    >
      <BarChart data={data} formatValue={formatHours} stacked height={220} />
    </ChartCard>
  );
}

import { useMemo } from 'react';
import type { ReportDay } from '@exyconn/tracker-core';
import { formatHours, monthChart } from '../../lib/report/charts';
import { useBrand } from '../../theme/BrandProvider';
import { useThemeColor } from '../../theme/useThemeColor';
import { ChartCard } from './ChartCard';
import { StackedBarChart } from './StackedBarChart';

interface Props {
  days: readonly ReportDay[];
  /** "February 2026" — says which month the columns belong to. */
  monthLabel: string;
}

/**
 * The employee's own month, day by day.
 *
 * The same shape their manager sees in the portal, drawn from the same numbers — a tracker
 * that shows you a different month than the one you are judged on is not transparency. Worked
 * sits under idle in one column per day, so "how solid was that day" is a length, not a sum
 * the reader has to do.
 */
export function ReportMonthChart({ days, monthLabel }: Readonly<Props>) {
  const { primary } = useBrand();
  const muted = useThemeColor('muted');
  const data = useMemo(() => {
    const shaped = monthChart(days);
    // Worked and idle MEAN something, so they hold the same two colours everywhere they appear.
    const colors: Readonly<Record<string, string>> = { active: primary, idle: muted };
    return {
      ...shaped,
      series: shaped.series.map((series) => ({ ...series, color: colors[series.id] })),
    };
  }, [days, primary, muted]);

  return (
    <ChartCard
      title="Hours this month"
      subtitle={`${monthLabel} · each column is one day`}
      data={data}
      formatValue={formatHours}
      labelHeading="Day"
      emptyText="No time tracked this month."
    >
      <StackedBarChart
        data={data}
        formatValue={formatHours}
        height={200}
        accessibilityLabel={`Hours this month, ${monthLabel}: worked stacked under idle for each day. Switch to Table to hear every value.`}
      />
    </ChartCard>
  );
}

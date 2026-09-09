import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { BarChart, ChartCard, formatHours, useChartPalette } from '@exyconn/ui';
import type { ReportDay } from '@shared/types';
import Surface from './Surface';
import { monthChart } from '../charts';

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
export default function ReportMonthChart({ days, monthLabel }: Readonly<Props>): ReactElement {
  const palette = useChartPalette();
  const data = useMemo(() => {
    const shaped = monthChart(days);
    // Worked and idle MEAN something, so they hold the same two slots everywhere they appear.
    const colors = [palette.series[0], palette.series[3]];
    return {
      ...shaped,
      series: shaped.series.map((series, index) => ({ ...series, color: colors[index] })),
    };
  }, [days, palette]);

  return (
    <Surface sx={{ p: 2 }}>
      <ChartCard
        title="Hours this month"
        subtitle={`${monthLabel} · each column is one day`}
        data={data}
        formatValue={formatHours}
        labelHeading="Day"
        emptyText="No time tracked this month."
      >
        <BarChart data={data} formatValue={formatHours} stacked height={200} />
      </ChartCard>
    </Surface>
  );
}

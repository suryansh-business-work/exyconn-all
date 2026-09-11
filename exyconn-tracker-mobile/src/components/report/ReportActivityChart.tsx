import { useMemo } from 'react';
import type { ReportDay } from '@exyconn/tracker-core';
import { activityTrend, formatPercent } from '../../lib/report/charts';
import { useBrand } from '../../theme/BrandProvider';
import { ChartCard } from './ChartCard';
import { TrendLineChart } from './TrendLineChart';

interface Props {
  days: readonly ReportDay[];
  /** "February 2026" — says which month the line belongs to. */
  monthLabel: string;
}

/** A share of the day has a natural top; an axis that stopped at 80% would flatter every day. */
const PERCENT_MAX = 100;

/**
 * How solid each day was, across the month.
 *
 * Hours answer "how long was I at it"; this answers "how much of that was work", which is
 * the number that actually gets discussed. A line rather than bars, because the question it
 * answers is about the shape of a run of days, not the size of any one of them.
 */
export function ReportActivityChart({ days, monthLabel }: Readonly<Props>) {
  const { secondary } = useBrand();
  const data = useMemo(() => {
    const shaped = activityTrend(days);
    return {
      ...shaped,
      series: shaped.series.map((series) => ({ ...series, color: secondary })),
    };
  }, [days, secondary]);

  return (
    <ChartCard
      title="Activity this month"
      subtitle={`${monthLabel} · share of tracked time that was active`}
      data={data}
      formatValue={formatPercent}
      labelHeading="Day"
      emptyText="No time tracked this month."
    >
      <TrendLineChart
        labels={data.labels}
        series={data.series[0]}
        max={PERCENT_MAX}
        formatValue={formatPercent}
        height={180}
        accessibilityLabel={`Activity this month, ${monthLabel}: the share of each day's tracked time that was active. Switch to Table to hear every value.`}
      />
    </ChartCard>
  );
}

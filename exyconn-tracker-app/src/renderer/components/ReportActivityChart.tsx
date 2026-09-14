import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { ChartCard, TrendChart, useChartPalette } from '@exyconn/ui';
import type { ReportDay } from '@shared/types';
import { useT } from '@exyconn/i18n';
import Surface from './Surface';
import { activityTrend } from '../charts';

/** Activity is a percentage, and a chart that said "62" would be a chart of nothing. */
const formatPercent = (value: number): string => `${Math.round(value)}%`;

interface Props {
  days: readonly ReportDay[];
  /** "February 2026" — says which month the line belongs to. */
  monthLabel: string;
}

/**
 * How solid each day was, across the month.
 *
 * Hours answer "how long was I at it"; this answers "how much of that was work", which is
 * the number that actually gets discussed. A line rather than bars, because the question it
 * answers is about the shape of a run of days, not the size of any one of them.
 */
export default function ReportActivityChart({ days, monthLabel }: Readonly<Props>): ReactElement {
  const t = useT();
  const palette = useChartPalette();
  const data = useMemo(() => {
    const shaped = activityTrend(days);
    return {
      ...shaped,
      // "Activity" is written in `charts.ts`, which has no React and so no `t`.
      series: shaped.series.map((series) => ({
        ...series,
        label: t(series.label),
        color: palette.series[2],
      })),
    };
  }, [days, palette, t]);

  return (
    <Surface sx={{ p: 2 }}>
      <ChartCard
        title={t('Activity this month')}
        subtitle={t('{month} · share of tracked time that was active', { month: monthLabel })}
        data={data}
        formatValue={formatPercent}
        labelHeading={t('Day')}
        emptyText={t('No time tracked this month.')}
      >
        <TrendChart data={data} formatValue={formatPercent} area height={180} />
      </ChartCard>
    </Surface>
  );
}

import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { BarChart, ChartCard, formatHours, useChartPalette } from '@exyconn/ui';
import type { ReportDay } from '@shared/types';
import { useT } from '@exyconn/i18n';
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
  const t = useT();
  const palette = useChartPalette();
  const data = useMemo(() => {
    const shaped = monthChart(days);
    // Worked and idle MEAN something, so they hold the same two slots everywhere they appear.
    const colors = [palette.series[0], palette.series[3]];
    return {
      ...shaped,
      // "Worked" and "Idle" are written in `charts.ts`, which has no React and so no `t`.
      series: shaped.series.map((series, index) => ({
        ...series,
        label: t(series.label),
        color: colors[index],
      })),
    };
  }, [days, palette, t]);

  return (
    <Surface sx={{ p: 2 }}>
      <ChartCard
        title={t('Hours this month')}
        subtitle={t('{month} · each column is one day', { month: monthLabel })}
        data={data}
        formatValue={formatHours}
        labelHeading={t('Day')}
        emptyText={t('No time tracked this month.')}
      >
        <BarChart data={data} formatValue={formatHours} stacked height={200} />
      </ChartCard>
    </Surface>
  );
}

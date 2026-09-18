import { useMemo } from 'react';
import { useT } from '@exyconn/i18n';
import { Box, ChartCard, TrendChart, type ChartData } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';

/** One bucket of a series over time, as the analytics API returns it. */
export interface Point {
  period: string;
  value: number;
}

interface PointChartProps {
  title: string;
  points: readonly Point[];
  formatValue: (value: number) => string;
  /** How a period key reads on the axis: a date in the workspace format, say. */
  formatPeriod: (period: string) => string;
  labelHeading: string;
  integer?: boolean;
}

/** One series over time as a line chart, with its table twin. */
export function PointChart({
  title,
  points,
  formatValue,
  formatPeriod,
  labelHeading,
  integer = false,
}: Readonly<PointChartProps>) {
  const t = useT();
  const data = useMemo<ChartData>(
    () => ({
      labels: points.map((point) => formatPeriod(point.period)),
      series: [{ id: 'value', label: t(title), values: points.map((point) => point.value) }],
    }),
    [points, formatPeriod, t, title],
  );
  return (
    <Box sx={[panel, { height: '100%' }]}>
      <ChartCard
        title={t(title)}
        data={data}
        formatValue={formatValue}
        labelHeading={t(labelHeading)}
        emptyText={t('Nothing to chart yet.')}
      >
        <TrendChart data={data} formatValue={formatValue} integer={integer} area />
      </ChartCard>
    </Box>
  );
}

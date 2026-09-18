import { useMemo } from 'react';
import { useT } from '@exyconn/i18n';
import {
  Box,
  ChartCard,
  Paragraph,
  Text,
  TrendChart,
  type ChartData,
} from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';

/** One month on the headcount line. */
interface HeadcountPoint {
  label: string;
  count: number;
}

interface HrHeadcountChartProps {
  points: readonly HeadcountPoint[];
  /** True while the dashboard query is in flight — "Loading…" rather than "not enough yet". */
  loading: boolean;
}

/** A headcount, in the reader's own digit grouping. */
const formatCount = (value: number): string => Math.round(value).toLocaleString();

/**
 * Employees over time. A single month is a dot, not a line, so anything shorter than two
 * points says so instead of drawing a chart that cannot show a trend.
 */
export function HrHeadcountChart({ points, loading }: Readonly<HrHeadcountChartProps>) {
  const t = useT();
  const title = t('Employee count over time');
  const data = useMemo<ChartData>(
    () => ({
      labels: points.map((point) => point.label),
      series: [{ id: 'headcount', label: t('Employees'), values: points.map((p) => p.count) }],
    }),
    [points, t],
  );

  if (points.length < 2) {
    return (
      <Box sx={[panel, { height: '100%' }]}>
        <Text size="label">{title}</Text>
        <Paragraph color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          {loading ? t('Loading…') : t('Not enough history to chart yet.')}
        </Paragraph>
      </Box>
    );
  }

  return (
    <Box sx={[panel, { height: '100%' }]}>
      <ChartCard
        title={title}
        subtitle={t('{count} months', { count: points.length })}
        data={data}
        formatValue={formatCount}
        labelHeading={t('Month')}
      >
        <TrendChart data={data} formatValue={formatCount} area integer />
      </ChartCard>
    </Box>
  );
}

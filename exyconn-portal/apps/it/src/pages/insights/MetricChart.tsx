import { useMemo } from 'react';
import { useT } from '@exyconn/i18n';
import { BarChart, Box, ChartCard, type ChartData } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';

/** A labelled number, as the IT read models return them. */
export interface Metric {
  label: string;
  value: number;
}

interface MetricChartProps {
  title: string;
  subtitle?: string;
  metrics: readonly Metric[];
  /** What the numbers are: money in the company currency, or a count. */
  formatValue: (value: number) => string;
  labelHeading: string;
  horizontal?: boolean;
  integer?: boolean;
}

/**
 * One series of labelled numbers as a bar chart, with its table twin — the shape every IT cost
 * and report chart has. Labels that are enum values are shown as the words they stand for.
 */
export function MetricChart({
  title,
  subtitle,
  metrics,
  formatValue,
  labelHeading,
  horizontal = false,
  integer = false,
}: Readonly<MetricChartProps>) {
  const t = useT();
  const data = useMemo<ChartData>(
    () => ({
      labels: metrics.map((metric) => metric.label.replaceAll('_', ' ')),
      series: [{ id: 'value', label: t(title), values: metrics.map((metric) => metric.value) }],
    }),
    [metrics, t, title],
  );
  return (
    <Box sx={[panel, { height: '100%' }]}>
      <ChartCard
        title={t(title)}
        subtitle={subtitle}
        data={data}
        formatValue={formatValue}
        labelHeading={t(labelHeading)}
        emptyText={t('Nothing to chart yet.')}
      >
        <BarChart data={data} formatValue={formatValue} horizontal={horizontal} integer={integer} />
      </ChartCard>
    </Box>
  );
}

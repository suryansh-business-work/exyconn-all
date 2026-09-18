import { useMemo } from 'react';
import { BarChart, Box, ChartCard, spacing, type ChartData } from '@/components/ui';
import { useT, type Interpolations } from '@exyconn/i18n';
import { panel } from '../glass/glass';

export interface BreakdownBucket {
  value: string;
  count: number;
}

interface StatBreakdownProps {
  title: string;
  /** Values for a {placeholder} in the title, e.g. "Email by template, {days}d". */
  titleValues?: Interpolations;
  buckets: BreakdownBucket[];
  /** Bar colour. Defaults to the chart palette's first slot. */
  accent?: string;
  emptyMessage?: string;
  /** Heading of the label column in the table view. */
  labelHeading?: string;
}

/** One bar's worth of height, and the least a chart with only a bar or two is given. */
const ROW_HEIGHT = spacing(4);
const MIN_HEIGHT = spacing(20);

/** SCREAMING_SNAKE enum values read badly in a UI; show them as words. */
function humanise(value: string): string {
  const spaced = value.replaceAll('_', ' ').toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** A count, as a whole number in the reader's own digit grouping. */
const formatCount = (value: number): string => Math.round(value).toLocaleString();

/**
 * How a module's rows are distributed across one field — the thing a register of rows cannot
 * show at a glance. A horizontal Chart.js bar chart, largest first, so the long names get room
 * to be read; the card's table view gives the exact counts without hovering.
 */
export function StatBreakdown({
  title,
  titleValues,
  buckets,
  accent,
  emptyMessage = 'Nothing to show yet.',
  labelHeading = 'Category',
}: Readonly<StatBreakdownProps>) {
  const t = useT();
  const data = useMemo<ChartData>(() => {
    const ordered = [...buckets].sort((a, b) => b.count - a.count);
    return {
      labels: ordered.map((bucket) => humanise(bucket.value)),
      series: [
        {
          id: 'count',
          label: t('Count'),
          values: ordered.map((bucket) => bucket.count),
          color: accent,
        },
      ],
    };
  }, [buckets, accent, t]);

  return (
    <Box sx={[panel, { height: '100%' }]}>
      <ChartCard
        title={t(title, titleValues)}
        data={data}
        formatValue={formatCount}
        labelHeading={t(labelHeading)}
        emptyText={t(emptyMessage)}
      >
        <BarChart
          data={data}
          formatValue={formatCount}
          horizontal
          integer
          height={Math.max(MIN_HEIGHT, data.labels.length * ROW_HEIGHT)}
        />
      </ChartCard>
    </Box>
  );
}

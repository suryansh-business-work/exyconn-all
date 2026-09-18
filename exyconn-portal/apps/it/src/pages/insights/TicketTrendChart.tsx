import { useMemo } from 'react';
import { useT } from '@exyconn/i18n';
import { Box, ChartCard, TrendChart, type ChartData } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import type { ItReportQuery } from '@exyconn/shell/graphql/generated';

type TrendPoint = ItReportQuery['itReport']['ticketTrend'][number];

const count = (value: number): string => Math.round(value).toLocaleString();

/** IT tickets opened and resolved per month — whether the queue is growing or shrinking. */
export function TicketTrendChart({ points }: Readonly<{ points: readonly TrendPoint[] }>) {
  const t = useT();
  const data = useMemo<ChartData>(
    () => ({
      labels: points.map((point) => point.period),
      series: [
        { id: 'opened', label: t('Opened'), values: points.map((point) => point.opened) },
        { id: 'resolved', label: t('Resolved'), values: points.map((point) => point.resolved) },
      ],
    }),
    [points, t],
  );
  return (
    <Box sx={[panel, { height: '100%' }]}>
      <ChartCard
        title={t('IT tickets per month')}
        data={data}
        formatValue={count}
        labelHeading={t('Month')}
        emptyText={t('No IT tickets in this period.')}
      >
        <TrendChart data={data} formatValue={count} integer />
      </ChartCard>
    </Box>
  );
}

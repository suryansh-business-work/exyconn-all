import { useMemo } from 'react';
import { useT } from '@exyconn/i18n';
import { BarChart, Box, ChartCard, TrendChart, type ChartData } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { formatMoney } from '@exyconn/shell/utils/money';
import type { CrmDashboardQuery } from '@exyconn/shell/graphql/generated';

type Dashboard = CrmDashboardQuery['crmDashboard'];

const count = (value: number): string => Math.round(value).toLocaleString();
const money = (value: number): string => formatMoney(value);

interface TimeChartProps<T> {
  points: readonly T[];
  labelOf: (point: T) => string;
  periodHeading: string;
}

/** Won revenue per period: whether the closing rate is rising or falling. */
export function WonTrendChart({
  points,
  labelOf,
  periodHeading,
}: Readonly<TimeChartProps<Dashboard['wonOverTime'][number]>>) {
  const t = useT();
  const data = useMemo<ChartData>(
    () => ({
      labels: points.map(labelOf),
      series: [{ id: 'won', label: t('Won value'), values: points.map((point) => point.value) }],
    }),
    [points, labelOf, t],
  );
  return (
    <Box sx={[panel, { height: '100%' }]}>
      <ChartCard
        title={t('Won revenue over time')}
        data={data}
        formatValue={money}
        labelHeading={periodHeading}
        emptyText={t('No deals won in this period.')}
      >
        <TrendChart data={data} formatValue={money} area />
      </ChartCard>
    </Box>
  );
}

/** The activity types in the order the stack is drawn, with the field each is read from. */
const TYPES = [
  { id: 'call', label: 'Calls' },
  { id: 'email', label: 'Emails' },
  { id: 'meeting', label: 'Meetings' },
  { id: 'note', label: 'Notes' },
  { id: 'task', label: 'Tasks' },
] as const;

/** Activities logged per period, stacked by type: how the team spends its selling time. */
export function ActivityChart({
  points,
  labelOf,
  periodHeading,
}: Readonly<TimeChartProps<Dashboard['activitiesOverTime'][number]>>) {
  const t = useT();
  const data = useMemo<ChartData>(
    () => ({
      labels: points.map(labelOf),
      series: TYPES.map((type) => ({
        id: type.id,
        label: t(type.label),
        values: points.map((point) => point[type.id]),
      })),
    }),
    [points, labelOf, t],
  );
  return (
    <Box sx={[panel, { height: '100%' }]}>
      <ChartCard
        title={t('Activities by type')}
        data={data}
        formatValue={count}
        labelHeading={periodHeading}
        emptyText={t('No activities logged in this period.')}
      >
        <BarChart data={data} formatValue={count} stacked integer />
      </ChartCard>
    </Box>
  );
}

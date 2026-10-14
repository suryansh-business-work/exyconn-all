import { useMemo, useState } from 'react';
import { useT } from '@exyconn/i18n';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import { Box, Skeleton, Stack } from '@exyconn/shell/components/ui';
import { EmptyState } from '@exyconn/shell/components/feedback/EmptyState';
import { usePageTitle } from '@exyconn/shell/components/layout/usePageTitle';
import { useWhatsappDemoStatsQuery } from '@exyconn/shell/graphql/generated';
import { DateRangeFilter } from '../shared/DateRangeFilter';
import { QueryErrorState } from '../shared/QueryErrorState';
import { useDateRange } from '../shared/useDateRange';
import { useIndustries } from '../shared/useIndustries';
import { AnalyticsCharts } from './AnalyticsCharts';
import { FlowTable } from './FlowTable';
import { FunnelPanel } from './FunnelPanel';
import { KpiCards } from './KpiCards';
import { flowRows, type DemoStats, type FlowRow } from './analytics.data';

/** Chart placeholders while the first answer is on its way. */
function ChartsSkeleton() {
  return (
    <Stack spacing={2} aria-busy>
      <Skeleton variant="rounded" height={300} />
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Skeleton variant="rounded" height={260} sx={{ flex: 1 }} />
        <Skeleton variant="rounded" height={260} sx={{ flex: 1 }} />
      </Stack>
    </Stack>
  );
}

interface PeriodBodyProps {
  stats: DemoStats;
  range: { from: string; to: string };
}

/** Everything below the headline numbers, for a period that had sessions. */
function PeriodBody({ stats, range }: Readonly<PeriodBodyProps>) {
  const { industryName } = useIndustries();
  const rows = useMemo(() => flowRows(stats.flows, industryName), [stats.flows, industryName]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = rows.find((row) => row.id === selectedId) ?? null;

  return (
    <Stack spacing={2}>
      <AnalyticsCharts stats={stats} />
      <FlowTable rows={rows} onSelect={(row: FlowRow) => setSelectedId(row.id)} />
      {selected && <FunnelPanel key={selected.id} flow={selected} range={range} />}
    </Stack>
  );
}

/**
 * Analytics: how the demo was used over a period — headline numbers, activity per day, the
 * industries and devices, and per-workflow completion with a funnel for the one selected.
 */
export function AnalyticsTab() {
  const t = useT();
  usePageTitle(t('WhatsApp demo analytics'));
  const { range, variables, preset, setRange } = useDateRange();
  const { data, loading, error, refetch } = useWhatsappDemoStatsQuery({ variables });
  const stats = data?.whatsappDemoStats;

  const body = () => {
    if (error) {
      return (
        <QueryErrorState error={error} title="Could not load the analytics." onRetry={refetch} />
      );
    }
    if (!stats) {
      return <ChartsSkeleton />;
    }
    if (stats.sessions === 0) {
      return (
        <EmptyState
          icon={<InsightsOutlinedIcon />}
          title="No demo sessions in this period"
          description="Pick a longer period, or run the demo to start collecting data."
        />
      );
    }
    return <PeriodBody stats={stats} range={variables} />;
  };

  return (
    <Stack spacing={3}>
      <DateRangeFilter range={range} preset={preset} onChange={setRange} />
      {error ? null : <KpiCards stats={stats} loading={loading && !stats} />}
      <Box>{body()}</Box>
    </Stack>
  );
}

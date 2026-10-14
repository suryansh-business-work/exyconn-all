import { useFormatters, useT } from '@exyconn/i18n';
import { Stack } from '@exyconn/shell/components/ui';
import { StatRow } from '@exyconn/shell/components/dashboard/StatRow';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { formatDemoDuration } from '../shared/duration';
import { percentOf, type DemoStats } from './analytics.data';

interface KpiCardsProps {
  stats: DemoStats | undefined;
  loading: boolean;
}

/** The figure a tile shows before the stats arrive; the tile draws a skeleton over it. */
const PENDING = '';

/**
 * The period's headline numbers in three rows of three: who came, how the flows went, and how
 * the AI parser behaved. StatCard translates the labels itself.
 */
export function KpiCards({ stats, loading }: Readonly<KpiCardsProps>) {
  const t = useT();
  const { formatNumber, formatPercent } = useFormatters();
  const show = (format: (value: DemoStats) => string): string => (stats ? format(stats) : PENDING);

  const engagement: StatItem[] = [
    { label: 'Sessions', value: show((s) => formatNumber(s.sessions)) },
    { label: 'Unique users', value: show((s) => formatNumber(s.uniqueUsers)) },
    { label: 'Avg session duration', value: show((s) => formatDemoDuration(s.avgSessionMs)) },
  ];
  const flows: StatItem[] = [
    { label: 'Flows started', value: show((s) => formatNumber(s.flowsStarted)) },
    { label: 'Flows completed', value: show((s) => formatNumber(s.flowsCompleted)) },
    { label: 'Completion rate', value: show((s) => formatPercent(s.completionRate * 100)) },
  ];
  const ai: StatItem[] = [
    { label: 'AI calls', value: show((s) => formatNumber(s.ai.calls)) },
    {
      label: 'AI failure rate',
      value: show((s) => formatPercent(percentOf(s.ai.failures, s.ai.calls))),
    },
    {
      label: 'AI avg latency',
      value: show((s) => t('{ms} ms', { ms: formatNumber(s.ai.avgLatencyMs) })),
    },
  ];

  return (
    <Stack spacing={2}>
      <StatRow stats={engagement} loading={loading} />
      <StatRow stats={flows} loading={loading} />
      <StatRow stats={ai} loading={loading} />
    </Stack>
  );
}

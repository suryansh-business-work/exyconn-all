import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import {
  Box,
  Grid,
  Stack,
  Text,
  ToggleButton,
  ToggleButtonGroup,
  color,
} from '@exyconn/shell/components/ui';
import { StatRow } from '@exyconn/shell/components/dashboard/StatRow';
import { MetricChart } from '@exyconn/shell/components/dashboard/MetricChart';
import { PointChart } from '@exyconn/shell/components/dashboard/PointChart';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { densePanel } from '@exyconn/shell/components/glass/glass';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useSocialAnalyticsQuery,
  type SocialAnalyticsQuery,
} from '@exyconn/shell/graphql/generated';
import { AiInsightsPanel } from './AiInsightsPanel';
import { NETWORK_LABEL } from './social.labels';

const PERIODS = [7, 30, 90] as const;
const count = (value: number) => Math.round(value).toLocaleString();
type Report = SocialAnalyticsQuery['socialAnalytics'];
type TopPost = Report['topPosts'][number];

function tilesOf(report: Report): StatItem[] {
  return [
    { label: 'Posts', value: count(report.posts), accent: color.blue[400] },
    { label: 'Engagement', value: count(report.engagement), accent: color.violet[400] },
    { label: 'Likes', value: count(report.likes), accent: color.green[500] },
    { label: 'Comments', value: count(report.comments), accent: color.cyan[600] },
    { label: 'Shares', value: count(report.shares), accent: color.amber[500] },
    { label: 'Views', value: count(report.views), accent: color.blue[400] },
    { label: 'Scheduled', value: count(report.scheduled), accent: color.amber[500] },
    { label: 'Failed', value: count(report.failed), accent: color.red[500] },
  ];
}

/** Social › Analytics: what the posts did, network by network and day by day, and AI on top. */
export function AnalyticsTab() {
  const t = useT();
  const { formatDate } = useSettings();
  const [days, setDays] = useState<number>(30);
  const { data, error } = useSocialAnalyticsQuery({
    variables: { days },
    fetchPolicy: 'cache-and-network',
  });
  const report = data?.socialAnalytics;
  const columns: Column<TopPost>[] = [
    { key: 'network', label: 'Network', render: (r) => NETWORK_LABEL[r.network] },
    {
      key: 'text',
      label: 'Post',
      render: (r) => (r.text.length > 80 ? `${r.text.slice(0, 80)}…` : r.text),
    },
    { key: 'engagement', label: 'Engagement', render: (r) => count(r.engagement) },
    { key: 'views', label: 'Views', render: (r) => count(r.metrics.views) },
    {
      key: 'publishedAt',
      label: 'Published',
      render: (r) => (r.publishedAt ? formatDate(r.publishedAt) : '—'),
    },
  ];

  return (
    <Stack spacing={2}>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={days}
        aria-label={t('Analytics period')}
        onChange={(_event, next: number | null) => {
          if (next) setDays(next);
        }}
      >
        {PERIODS.map((period) => (
          <ToggleButton key={period} value={period}>
            {t('{count} days', { count: period })}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      {error && <Text color="error">{error.message}</Text>}
      {report && (
        <>
          <StatRow stats={tilesOf(report)} />
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, md: 8 }}>
              <PointChart
                title="Engagement per day"
                points={report.engagementPerDay}
                formatValue={count}
                formatPeriod={formatDate}
                labelHeading="Day"
                integer
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <MetricChart
                title="Engagement by network"
                metrics={report.byNetwork.map((row) => ({
                  label: NETWORK_LABEL[row.network],
                  value: row.engagement,
                }))}
                formatValue={count}
                labelHeading="Network"
                horizontal
                integer
              />
            </Grid>
          </Grid>
          <Box sx={densePanel}>
            <Text weight="medium" sx={{ mb: 1 }}>
              {t('Top posts')}
            </Text>
            <DataTable
              columns={columns}
              rows={[...report.topPosts]}
              emptyMessage="No published posts in this period yet."
            />
          </Box>
        </>
      )}
      <AiInsightsPanel days={days} />
    </Stack>
  );
}

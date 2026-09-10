import { Alert, Box, Divider, Flex, Grid, radius, Text } from '@exyconn/shell/components/ui';
import { BarChart, ChartCard, type ChartData } from '@exyconn/shell/components/ui';
import { useCampaignMetricsQuery } from '@exyconn/shell/graphql/generated';

interface CampaignEngagementProps {
  campaignId: string;
}

/** One headline number with its caption. */
function Metric({ label, value, hint }: Readonly<{ label: string; value: string; hint?: string }>) {
  return (
    <Box>
      <Text size="caption" color="text.secondary">
        {label}
      </Text>
      <Text size="lg" weight="bold" sx={{ display: 'block' }}>
        {value}
      </Text>
      {hint ? (
        <Text size="caption" color="text.secondary">
          {hint}
        </Text>
      ) : null}
    </Box>
  );
}

/** Trims a URL to something readable on a chart axis without losing which link it is. */
function shortUrl(url: string): string {
  const withoutScheme = url.replace(/^https?:\/\//i, '');
  return withoutScheme.length > 42 ? `${withoutScheme.slice(0, 39)}…` : withoutScheme;
}

/**
 * What a campaign actually did after it left.
 *
 * The caveat on the open rate is not decoration. Mail clients prefetch images, cache them and
 * very often block them outright, so an open rate is a FLOOR — the campaign was opened by at
 * least this many. Presenting it as a measurement is how a decision gets made on a number that
 * can be wrong by half in one direction only. Clicks carry no such caveat.
 */
export function CampaignEngagement({ campaignId }: Readonly<CampaignEngagementProps>) {
  const { data, loading } = useCampaignMetricsQuery({ variables: { campaignId } });
  const metrics = data?.campaignMetrics;
  const links = data?.campaignTopLinks ?? [];

  if (loading && !metrics) {
    return (
      <Text size="sm" color="text.secondary">
        Loading engagement…
      </Text>
    );
  }

  if (!metrics || metrics.sent === 0) {
    return (
      <Text size="sm" color="text.secondary">
        Nothing to report yet — this campaign has not been sent.
      </Text>
    );
  }

  const linkChart: ChartData = {
    labels: links.map((link) => shortUrl(link.url)),
    series: [{ id: 'clicks', label: 'Clicks', values: links.map((link) => link.clicks) }],
  };

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <Metric label="Sent" value={String(metrics.sent)} />
        </Grid>
        <Grid item xs={6} md={3}>
          <Metric
            label="Opened"
            value={`${metrics.openRate}%`}
            hint={`${metrics.opened} people · ${metrics.totalOpens} opens`}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <Metric
            label="Clicked"
            value={`${metrics.clickRate}%`}
            hint={`${metrics.clicked} people · ${metrics.totalClicks} clicks`}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <Metric
            label="Click-through"
            value={`${metrics.clickThroughRate}%`}
            hint="of those who opened"
          />
        </Grid>
      </Grid>

      <Alert severity="info" variant="outlined" sx={{ mt: 2, borderRadius: `${radius.sm}px` }}>
        Opens are a floor, not a count: many mail clients block or cache the tracking image, so this
        campaign was opened by <strong>at least</strong> {metrics.opened}{' '}
        {metrics.opened === 1 ? 'person' : 'people'}. Clicks are exact.
      </Alert>

      {links.length > 0 ? (
        <>
          <Divider sx={{ my: 2 }} />
          <ChartCard
            title="Most clicked links"
            subtitle="Where the campaign actually sent people"
            data={linkChart}
            formatValue={(clicks) => String(clicks)}
            labelHeading="Link"
            emptyText="No links were clicked."
          >
            <BarChart
              data={linkChart}
              formatValue={(clicks) => String(clicks)}
              horizontal
              height={Math.max(160, links.length * 30 + 60)}
            />
          </ChartCard>
        </>
      ) : (
        <Flex sx={{ mt: 2 }}>
          <Text size="sm" color="text.secondary">
            No links have been clicked yet.
          </Text>
        </Flex>
      )}
    </Box>
  );
}

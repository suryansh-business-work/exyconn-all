import { useT } from '@exyconn/i18n';
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
  const t = useT();
  const { data, loading } = useCampaignMetricsQuery({ variables: { campaignId } });
  const metrics = data?.campaignMetrics;
  const links = data?.campaignTopLinks ?? [];

  if (loading && !metrics) {
    return (
      <Text size="sm" color="text.secondary">
        {t('Loading engagement…')}
      </Text>
    );
  }

  if (!metrics || metrics.sent === 0) {
    return (
      <Text size="sm" color="text.secondary">
        {t('Nothing to report yet — this campaign has not been sent.')}
      </Text>
    );
  }

  const linkChart: ChartData = {
    labels: links.map((link) => shortUrl(link.url)),
    series: [{ id: 'clicks', label: t('Clicks'), values: links.map((link) => link.clicks) }],
  };

  // One whole sentence per plural form: a language that agrees differently cannot be served
  // from an interpolated "person"/"people" fragment.
  let opensCaveat = t(
    'Opens are a floor, not a count: many mail clients block or cache the tracking image, so this campaign was opened by at least {count} people. Clicks are exact.',
    { count: metrics.opened },
  );
  if (metrics.opened === 1) {
    opensCaveat = t(
      'Opens are a floor, not a count: many mail clients block or cache the tracking image, so this campaign was opened by at least {count} person. Clicks are exact.',
      { count: metrics.opened },
    );
  }

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid
          size={{
            xs: 6,
            md: 3,
          }}
        >
          <Metric label={t('Sent')} value={String(metrics.sent)} />
        </Grid>
        <Grid
          size={{
            xs: 6,
            md: 3,
          }}
        >
          <Metric
            label={t('Opened')}
            value={`${metrics.openRate}%`}
            hint={t('{people} people · {opens} opens', {
              people: metrics.opened,
              opens: metrics.totalOpens,
            })}
          />
        </Grid>
        <Grid
          size={{
            xs: 6,
            md: 3,
          }}
        >
          <Metric
            label={t('Clicked')}
            value={`${metrics.clickRate}%`}
            hint={t('{people} people · {clicks} clicks', {
              people: metrics.clicked,
              clicks: metrics.totalClicks,
            })}
          />
        </Grid>
        <Grid
          size={{
            xs: 6,
            md: 3,
          }}
        >
          <Metric
            label={t('Click-through')}
            value={`${metrics.clickThroughRate}%`}
            hint={t('of those who opened')}
          />
        </Grid>
      </Grid>

      <Alert severity="info" variant="outlined" sx={{ mt: 2, borderRadius: `${radius.sm}px` }}>
        {opensCaveat}
      </Alert>

      {links.length > 0 ? (
        <>
          <Divider sx={{ my: 2 }} />
          <ChartCard
            title={t('Most clicked links')}
            subtitle={t('Where the campaign actually sent people')}
            data={linkChart}
            formatValue={(clicks) => String(clicks)}
            labelHeading={t('Link')}
            emptyText={t('No links were clicked.')}
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
            {t('No links have been clicked yet.')}
          </Text>
        </Flex>
      )}
    </Box>
  );
}

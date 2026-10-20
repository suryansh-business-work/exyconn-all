import { Link as RouterLink } from 'react-router-dom';
import { useFormatters, useT } from '@exyconn/i18n';
import {
  ChartCard,
  Grid,
  Link,
  List,
  ListItem,
  ListItemText,
  Text,
  TrendChart,
} from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import type { MarketingDashboardQuery } from '@exyconn/shell/graphql/generated';
import { studioPath } from './CampaignStudioPage';

type Dashboard = MarketingDashboardQuery['marketingDashboard'];
type Row = Dashboard['recent'][number];

/** A short list of campaigns, each linking to its studio. */
function CampaignList({
  title,
  rows,
  empty,
  showState,
}: Readonly<{ title: string; rows: readonly Row[]; empty: string; showState: boolean }>) {
  const t = useT();
  const { formatDateTime, formatNumber } = useFormatters();
  return (
    <Grid size={{ xs: 12, md: 6 }}>
      <Text size="sm" weight="semibold">
        {t(title)}
      </Text>
      {rows.length === 0 ? (
        <Text size="sm" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          {t(empty)}
        </Text>
      ) : (
        <List dense>
          {rows.map((row) => (
            <ListItem
              key={row.id}
              disableGutters
              secondaryAction={
                showState && row.sendState ? <StatusChip value={row.sendState} /> : null
              }
            >
              <ListItemText
                primary={
                  <Link component={RouterLink} to={studioPath(row.id)}>
                    {row.name}
                  </Link>
                }
                secondary={[
                  row.at ? formatDateTime(row.at) : '',
                  row.recipients === null || row.recipients === undefined
                    ? ''
                    : t('{count} recipient(s)', { count: formatNumber(row.recipients) }),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Grid>
  );
}

/** Copies sent per day for the last 30 days, then what is coming up and what just went. */
export function DashboardActivity({ dashboard }: Readonly<{ dashboard: Dashboard }>) {
  const t = useT();
  const { formatNumber, formatDate } = useFormatters();
  const data = {
    labels: dashboard.daily.map((day) => formatDate(day.day)),
    series: [
      { id: 'sent', label: t('Copies sent'), values: dashboard.daily.map((day) => day.sent) },
    ],
  };
  return (
    <Grid container spacing={3}>
      <Grid size={12}>
        <ChartCard
          title={t('Emails sent — last 30 days')}
          subtitle={t('Copies the mail server accepted, per day')}
          data={data}
          formatValue={(value) => formatNumber(value)}
          labelHeading={t('Day')}
          emptyText={t('Nothing was sent in the last 30 days.')}
        >
          <TrendChart data={data} formatValue={(value) => formatNumber(value)} area integer />
        </ChartCard>
      </Grid>
      <CampaignList
        title="Scheduled next"
        rows={dashboard.upcoming}
        empty="Nothing is scheduled."
        showState={false}
      />
      <CampaignList
        title="Sent recently"
        rows={dashboard.recent}
        empty="No campaign has been sent yet."
        showState
      />
    </Grid>
  );
}

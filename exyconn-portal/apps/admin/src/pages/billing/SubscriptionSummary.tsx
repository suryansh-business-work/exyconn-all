import { useFormatters, useT } from '@exyconn/i18n';
import { Card, CardContent, Chip, Stack } from '@exyconn/shell/components/ui';
import { DetailFact, DetailFactGrid } from '@exyconn/shell/components/data/DetailFact';
import { StatRow } from '@exyconn/shell/components/dashboard/StatRow';
import type { BillingOverviewFieldsFragment } from '@exyconn/shell/graphql/generated';
import { STATUS_COLORS, STATUS_LABELS, modulesLabel } from './plan.facts';

/** A limit beside what is used of it: "3 of 10", or just the count when unlimited. */
function usage(used: string, limit: number, limitText: string): string {
  return limit === 0 ? used : `${used} / ${limitText}`;
}

/** Where the company stands: its plan, status, dates and use against the plan's limits. */
export function SubscriptionSummary({
  overview,
}: Readonly<{ overview: BillingOverviewFieldsFragment }>) {
  const t = useT();
  const { formatDate, formatNumber, formatCurrency } = useFormatters();
  const { subscription, plan } = overview;
  const usd = (value: number) => formatCurrency(value, { currency: 'USD' });
  const seatLimit = plan?.seatLimit ?? 0;
  const aiCap = plan?.aiMonthlyUsdCap ?? 0;

  return (
    <Stack spacing={2}>
      <StatRow
        stats={[
          {
            label: 'Active people',
            value: usage(formatNumber(overview.seatsUsed), seatLimit, formatNumber(seatLimit)),
          },
          {
            label: 'AI this month',
            value: usage(usd(overview.aiSpentThisMonthUsd), aiCap, usd(aiCap)),
          },
        ]}
      />
      <Card variant="outlined">
        <CardContent>
          <DetailFactGrid>
            <DetailFact label="Plan">{plan?.name ?? t('No plan — no limits apply')}</DetailFact>
            <DetailFact label="Status">
              {subscription ? (
                <Chip
                  size="small"
                  variant="outlined"
                  color={STATUS_COLORS[subscription.status]}
                  label={t(STATUS_LABELS[subscription.status])}
                />
              ) : (
                '—'
              )}
            </DetailFact>
            <DetailFact label="Modules">{plan ? modulesLabel(plan, t) : '—'}</DetailFact>
            <DetailFact label="Trial ends">
              {subscription?.trialEndsAt ? formatDate(subscription.trialEndsAt) : '—'}
            </DetailFact>
            <DetailFact label="Renews">
              {subscription?.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : '—'}
            </DetailFact>
            <DetailFact label="Ends at period end">
              {subscription?.cancelAtPeriodEnd ? t('Yes') : t('No')}
            </DetailFact>
          </DetailFactGrid>
        </CardContent>
      </Card>
    </Stack>
  );
}

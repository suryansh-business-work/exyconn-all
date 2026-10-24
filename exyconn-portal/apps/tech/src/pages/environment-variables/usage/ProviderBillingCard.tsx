import { useT } from '@exyconn/i18n';
import { Alert, Box, Skeleton } from '@exyconn/shell/components/ui';
import { PointChart } from '@exyconn/shell/components/dashboard/PointChart';
import { BillingProvider, useProviderBillingQuery } from '@exyconn/shell/graphql/generated';
import type { UsageView } from './useUsageView';

/** OpenAI's Costs API answers at most this many days. */
const MAX_BILLING_DAYS = 180;

/**
 * What the provider itself billed, read with its billing key — the real bill, beside the
 * estimate counted from our own calls. Without a key it says where to add one.
 */
export function ProviderBillingCard({
  provider,
  view,
}: Readonly<{ provider: BillingProvider; view: UsageView }>) {
  const t = useT();
  const days = Math.min(view.days, MAX_BILLING_DAYS);
  const { data, loading, error } = useProviderBillingQuery({
    variables: { provider, days },
    fetchPolicy: 'cache-and-network',
  });
  const bill = data?.providerBilling;

  if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }
  if (!bill) {
    if (loading) {
      return <Skeleton variant="rounded" height={220} />;
    }
    return (
      <Alert severity="info">
        {t('Add a billing key in Environment Variables > Billing keys to see what was billed.')}
      </Alert>
    );
  }
  return (
    <Box>
      <PointChart
        title="Billed by the provider"
        points={bill.days.map((day) => ({ period: day.day, value: day.amountUsd }))}
        formatValue={view.money}
        formatPeriod={(period) => period}
        labelHeading="Day"
      />
      <Alert severity="success" sx={{ mt: 1 }}>
        {t('Billed in all over the period: {amount}', { amount: view.money(bill.totalUsd) })}
      </Alert>
    </Box>
  );
}

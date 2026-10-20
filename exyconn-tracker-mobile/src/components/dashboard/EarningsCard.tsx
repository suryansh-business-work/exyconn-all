import { XStack, YStack } from 'tamagui';
import { useFormatters, useT } from '@exyconn/i18n';
import type { TrackerEarnings } from '@exyconn/tracker-core';
import { useEarnings } from '../../hooks/useEarnings';
import { Notice } from '../ui/Notice';
import { Surface } from '../ui/Surface';
import { Body, Caption, Heading } from '../ui/Typography';

const MS_PER_HOUR = 3_600_000;

interface Props {
  timezone: string;
  /** Re-reads the figures whenever a sync lands, since that is when tracked time grows. */
  lastSyncAt: string | null;
}

interface PeriodProps {
  /** Already translated. */
  label: string;
  earnings: TrackerEarnings;
}

/** One period: the amount, and the "hours × rate" it was worked out from. */
function EarningsPeriod({ label, earnings }: Readonly<PeriodProps>) {
  const t = useT();
  const { formatCurrency, formatNumber } = useFormatters();
  const money = (value: number | null): string =>
    formatCurrency(value, { currency: earnings.currency });
  const workings = t('{hours} h × {rate} per hour', {
    hours: formatNumber(earnings.trackedMs / MS_PER_HOUR, { maximumFractionDigits: 2 }),
    rate: money(earnings.rate),
  });
  return (
    <YStack flex={1} minWidth={0} gap="$0.5">
      <Caption>{label}</Caption>
      <Body size="$6" fontWeight="700" fontVariant={['tabular-nums']}>
        {money(earnings.amount)}
      </Body>
      <Caption>{workings}</Caption>
    </YStack>
  );
}

/**
 * What the employee has earned today and this month, for hourly pay: tracked hours × their
 * rate. Other pay is not paid by the hour, so for it the card does not appear at all.
 */
export function EarningsCard({ timezone, lastSyncAt }: Readonly<Props>) {
  const t = useT();
  const { today, month, failed } = useEarnings(timezone, lastSyncAt);
  // Only hourly pay has an amount. A failed read stays hidden unless an earlier read showed
  // one (the last good answer is kept), so salaried staff never see an earnings error. Today
  // and the month arrive together (useEarnings), so a month on show always has its today.
  if (today === null || month?.amount == null) {
    return null;
  }
  return (
    <Surface padding="$4" gap="$2">
      <YStack gap="$0.5">
        <Heading>{t('Earnings')}</Heading>
        <Caption>{t('Tracked hours × your hourly rate.')}</Caption>
      </YStack>
      {failed ? <Notice severity="warning">{t('Could not load your earnings.')}</Notice> : null}
      <XStack gap="$3">
        <EarningsPeriod label={t('Today')} earnings={today} />
        <EarningsPeriod label={t('This month')} earnings={month} />
      </XStack>
    </Surface>
  );
}

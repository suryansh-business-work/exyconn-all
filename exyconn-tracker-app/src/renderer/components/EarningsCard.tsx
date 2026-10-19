import type { ReactElement } from 'react';
import { Alert, Box, Stack, TRACKER_RADIUS, Typography } from '@exyconn/ui';
import { useFormatters, useT } from '@exyconn/i18n';
import type { TrackerEarnings } from '@shared/types';
import useEarnings from '../hooks/useEarnings';
import { useAnnounce } from '../a11y/LiveAnnouncer';
import Surface from './Surface';

const MS_PER_HOUR = 3_600_000;

interface Props {
  timezone: string;
  /** Changes when a sync lands — the only moment tracked time, and so earnings, can move. */
  lastSyncAt: string | null;
}

interface PeriodProps {
  /** Already translated. */
  label: string;
  earnings: TrackerEarnings | null;
}

/** One period: the amount, and the "hours × rate" it was worked out from. */
function EarningsPeriod({ label, earnings }: Readonly<PeriodProps>): ReactElement {
  const t = useT();
  const { formatCurrency, formatNumber } = useFormatters();
  const money = (value: number | null): string =>
    formatCurrency(value, { currency: earnings?.currency });
  const amount = earnings === null ? '—' : money(earnings.amount);
  const workings =
    earnings === null
      ? ''
      : t('{hours} h × {rate} per hour', {
          hours: formatNumber(earnings.trackedMs / MS_PER_HOUR, { maximumFractionDigits: 2 }),
          rate: money(earnings.rate),
        });

  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography variant="h6" component="p" sx={{ fontWeight: 700 }}>
        {amount}
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {workings}
      </Typography>
    </Box>
  );
}

/**
 * What the employee has earned today and this month, for hourly pay: tracked hours × their
 * rate. Other pay is not paid by the hour, so for it the card does not appear at all.
 */
export default function EarningsCard({
  timezone,
  lastSyncAt,
}: Readonly<Props>): ReactElement | null {
  const t = useT();
  const { today, month } = useEarnings(timezone, lastSyncAt);
  const failed = today.failed || month.failed;
  const error = failed ? t('Could not load your earnings.') : null;
  useAnnounce(error);

  // Only hourly pay has an amount. A failed read stays hidden unless an earlier read showed
  // one (the last good answer is kept), so salaried staff never see an earnings error.
  if (month.data?.amount == null) {
    return null;
  }

  return (
    <Surface sx={{ p: 2.5 }}>
      <Stack spacing={1}>
        <Stack spacing={0.25}>
          <Typography variant="subtitle2" component="h2">
            {t('Earnings')}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {t('Tracked hours × your hourly rate.')}
          </Typography>
        </Stack>
        {error === null ? null : (
          <Alert severity="warning" variant="outlined" sx={{ borderRadius: `${TRACKER_RADIUS}px` }}>
            {error}
          </Alert>
        )}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          <EarningsPeriod label={t('Today')} earnings={today.data} />
          <EarningsPeriod label={t('This month')} earnings={month.data} />
        </Box>
      </Stack>
    </Surface>
  );
}

import { useT } from '@exyconn/i18n';
import { MenuItem, Stack, Text, TextField } from '@exyconn/shell/components/ui';
import { USAGE_WINDOWS } from './usage.providers';
import type { UsageView } from './useUsageView';

/** The window and the currency every number below is read in, with the rate's date. */
export function UsageControls({ view }: Readonly<{ view: UsageView }>) {
  const t = useT();
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.5}
      sx={{ alignItems: { sm: 'center' }, mb: 2 }}
    >
      <TextField
        select
        size="small"
        label={t('Period')}
        value={view.days}
        onChange={(event) => view.setDays(Number(event.target.value))}
        sx={{ minWidth: 160 }}
      >
        {USAGE_WINDOWS.map((days) => (
          <MenuItem key={days} value={days}>
            {t('Last {count} days', { count: days })}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        size="small"
        label={t('Currency')}
        value={view.currency}
        onChange={(event) => view.setCurrency(event.target.value)}
        sx={{ minWidth: 140 }}
      >
        {view.currencies.map((currency) => (
          <MenuItem key={currency} value={currency}>
            {currency}
          </MenuItem>
        ))}
      </TextField>
      <Text size="sm" color="text.secondary">
        {view.rateDate
          ? t('Costs are recorded in USD and converted at the rate of {date}.', {
              date: view.rateDate,
            })
          : t('Costs are shown in USD until the first exchange rates arrive.')}
      </Text>
    </Stack>
  );
}

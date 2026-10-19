import { useSearchParams } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { DatePicker, Stack, ToggleButton, ToggleButtonGroup } from '@exyconn/shell/components/ui';
import { dayKey, dayValue, PERIODS, type PeriodKind, type PeriodParams } from './period';

const LABEL: Readonly<Record<PeriodKind, string>> = {
  month: 'This month',
  quarter: 'This quarter',
  year: 'This year',
  custom: 'Custom',
};

/**
 * The overview's period, kept in the address (`?period=quarter`, or `?period=custom&from=…&to=…`)
 * so a link to the dashboard opens on the same numbers. The custom days use MUI X pickers.
 */
export function PeriodSelector({ period }: Readonly<{ period: PeriodParams }>) {
  const t = useT();
  const [params, setParams] = useSearchParams();

  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
    }
    setParams(next, { replace: true });
  };
  const choose = (kind: PeriodKind) =>
    update(kind === 'custom' ? { period: kind } : { period: kind, from: '', to: '' });
  const setDay = (end: 'from' | 'to', date: Date | null) =>
    update({ [end]: date && !Number.isNaN(date.getTime()) ? dayKey(date) : '' });

  const from = dayValue(period.fromDay);
  const to = dayValue(period.toDay);
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={1}
      sx={{ alignItems: { md: 'center' } }}
    >
      <ToggleButtonGroup
        exclusive
        size="small"
        value={period.kind}
        aria-label={t('Dashboard period')}
        onChange={(_event, next: PeriodKind | null) => {
          if (next) {
            choose(next);
          }
        }}
        sx={{ flexWrap: 'wrap' }}
      >
        {PERIODS.map((kind) => (
          <ToggleButton key={kind} value={kind}>
            {t(LABEL[kind])}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      {period.kind === 'custom' && (
        <Stack direction="row" spacing={1}>
          <DatePicker
            label={t('From')}
            value={from}
            maxDate={to ?? undefined}
            onChange={(date) => setDay('from', date)}
            slotProps={{ textField: { size: 'small' } }}
          />
          <DatePicker
            label={t('To')}
            value={to}
            minDate={from ?? undefined}
            onChange={(date) => setDay('to', date)}
            slotProps={{ textField: { size: 'small' } }}
          />
        </Stack>
      )}
    </Stack>
  );
}

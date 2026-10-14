import { useT } from '@exyconn/i18n';
import { isValid } from 'date-fns';
import { DatePicker, Stack, ToggleButton, ToggleButtonGroup } from '@exyconn/shell/components/ui';
import { RANGE_PRESETS, presetRange, type DateRange } from './useDateRange';

interface DateRangeFilterProps {
  range: DateRange;
  preset: number | null;
  onChange: (next: DateRange) => void;
}

/** A completed, real date — MUI X reports every half-typed section as an Invalid Date. */
function usable(date: Date | null): date is Date {
  return date !== null && isValid(date);
}

/**
 * The period filter shared by Analytics and Sessions: quick 7/30/90-day presets and two MUI X
 * date pickers. The pickers bound each other, so "from" can never pass "to".
 */
export function DateRangeFilter({ range, preset, onChange }: Readonly<DateRangeFilterProps>) {
  const t = useT();
  const today = new Date();

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={1.5}
      sx={{ alignItems: { xs: 'stretch', md: 'center' } }}
    >
      <ToggleButtonGroup
        exclusive
        size="small"
        value={preset}
        aria-label={t('Quick date range')}
        onChange={(_event, days: number | null) => {
          if (days !== null) {
            onChange(presetRange(days));
          }
        }}
      >
        {RANGE_PRESETS.map((days) => (
          <ToggleButton key={days} value={days} sx={{ px: 1.5, flex: { xs: 1, md: 'none' } }}>
            {t('Last {days} days', { days })}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <Stack direction="row" spacing={1.5}>
        <DatePicker
          label={t('From')}
          value={range.from}
          maxDate={range.to}
          onChange={(date) => {
            if (usable(date)) {
              onChange({ ...range, from: date });
            }
          }}
          slotProps={{ textField: { size: 'small', fullWidth: true } }}
        />
        <DatePicker
          label={t('To')}
          value={range.to}
          minDate={range.from}
          maxDate={today}
          onChange={(date) => {
            if (usable(date)) {
              onChange({ ...range, to: date });
            }
          }}
          slotProps={{ textField: { size: 'small', fullWidth: true } }}
        />
      </Stack>
    </Stack>
  );
}

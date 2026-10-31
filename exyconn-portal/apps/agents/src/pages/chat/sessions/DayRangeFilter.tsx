import { useT } from '@exyconn/i18n';
import { DatePicker, Grid } from '@exyconn/shell/components/ui';
import { rangeIsBackwards, type DayRange } from './chat-sessions.filters';

interface DayRangeFilterProps {
  fromLabel: string;
  toLabel: string;
  value: DayRange;
  onChange: (next: DayRange) => void;
}

const FIELD = { fullWidth: true, size: 'small' } as const;

/** Two clearable MUI X date pickers bounding one date field of the chat list. */
export function DayRangeFilter({
  fromLabel,
  toLabel,
  value,
  onChange,
}: Readonly<DayRangeFilterProps>) {
  const t = useT();
  const backwards = rangeIsBackwards(value);

  return (
    <>
      <Grid size={{ xs: 6, sm: 3, md: 1.5 }}>
        <DatePicker
          label={t(fromLabel)}
          value={value.from}
          maxDate={value.to ?? undefined}
          onChange={(from) => onChange({ ...value, from })}
          slotProps={{ textField: FIELD, field: { clearable: true } }}
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 3, md: 1.5 }}>
        <DatePicker
          label={t(toLabel)}
          value={value.to}
          minDate={value.from ?? undefined}
          onChange={(to) => onChange({ ...value, to })}
          slotProps={{
            textField: {
              ...FIELD,
              error: backwards,
              helperText: backwards ? t('Must be on or after the start') : undefined,
            },
            field: { clearable: true },
          }}
        />
      </Grid>
    </>
  );
}

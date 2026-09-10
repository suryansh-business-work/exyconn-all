import { Grid } from '@exyconn/shell/components/ui';
import { DatePicker } from '@exyconn/ui/pickers';
import { toDateOrNull } from './tracker.billing';

export interface BillingRange {
  from: string;
  to: string;
}

interface BillingRangePickerProps {
  range: BillingRange;
  onChange: (range: BillingRange) => void;
}

/** The From/To pickers both billing tabs share, so switching tabs keeps the period. */
export function BillingRangePicker({ range, onChange }: Readonly<BillingRangePickerProps>) {
  const set = (key: keyof BillingRange) => (value: Date | null) => {
    const next = toDateOrNull(value);
    if (next) {
      onChange({ ...range, [key]: next.toISOString() });
    }
  };
  return (
    <>
      <Grid
        size={{
          xs: 12,
          sm: 6,
          md: 3
        }}>
        <DatePicker
          label="From"
          value={new Date(range.from)}
          onChange={set('from')}
          slotProps={{ textField: { fullWidth: true, size: 'small' } }}
        />
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 6,
          md: 3
        }}>
        <DatePicker
          label="To"
          value={new Date(range.to)}
          onChange={set('to')}
          slotProps={{ textField: { fullWidth: true, size: 'small' } }}
        />
      </Grid>
    </>
  );
}

import { Controller, useFormContext } from 'react-hook-form';
import { DatePicker } from '@/components/ui';
import { toDate } from '@/utils/date';

interface RhfDatePickerProps {
  name: string;
  label: string;
}

/** React Hook Form-bound MUIX date picker. Stores the value as an ISO string. */
export function RhfDatePicker({ name, label }: RhfDatePickerProps) {
  const { control } = useFormContext();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <DatePicker
          label={label}
          value={toDate(field.value)}
          // MUIX fires onChange for every section typed, so a half-entered date arrives
          // as an Invalid Date — toISOString() throws RangeError on one and took the
          // whole form down. An incomplete date is simply "not set yet".
          onChange={(date) =>
            field.onChange(date && !Number.isNaN(date.getTime()) ? date.toISOString() : '')
          }
          slotProps={{
            textField: {
              // Matches RhfTextField, so a field is addressable as input[name="…"]
              // in tests and by label-less assistive queries.
              name,
              fullWidth: true,
              onBlur: field.onBlur,
              error: Boolean(fieldState.error),
              helperText: fieldState.error?.message,
            },
          }}
        />
      )}
    />
  );
}

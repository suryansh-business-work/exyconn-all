import { Controller, useFormContext } from 'react-hook-form';
import { DateTimePicker } from '@/components/ui';
import { toDate } from '@/utils/date';

interface RhfDateTimePickerProps {
  name: string;
  label: string;
  /** Nothing later than this can be picked — used to keep a claim out of the future. */
  maxDateTime?: Date;
  helperText?: string;
}

/**
 * React Hook Form-bound MUIX date-and-time picker, storing the value as an ISO string.
 *
 * The date-only sibling is `RhfDatePicker`; this one exists for the fields where the hour
 * is the point — a window of work, not a calendar day.
 */
export function RhfDateTimePicker({
  name,
  label,
  maxDateTime,
  helperText,
}: Readonly<RhfDateTimePickerProps>) {
  const { control } = useFormContext();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <DateTimePicker
          label={label}
          value={toDate(field.value)}
          maxDateTime={maxDateTime}
          // MUIX fires onChange for every section typed, so a half-entered value arrives
          // as an Invalid Date — toISOString() throws RangeError on one and took the
          // whole form down. An incomplete value is simply "not set yet".
          onChange={(date) =>
            field.onChange(date && !Number.isNaN(date.getTime()) ? date.toISOString() : '')
          }
          slotProps={{
            textField: {
              // Matches RhfTextField, so a field is addressable as input[name="…"].
              name,
              fullWidth: true,
              onBlur: field.onBlur,
              error: Boolean(fieldState.error),
              helperText: fieldState.error?.message ?? helperText,
            },
          }}
        />
      )}
    />
  );
}

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
          onChange={(date) => field.onChange(date ? date.toISOString() : '')}
          slotProps={{
            textField: {
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

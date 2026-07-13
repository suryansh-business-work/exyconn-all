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
          onChange={(date) => field.onChange(date ? date.toISOString() : '')}
          slotProps={{
            textField: {
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

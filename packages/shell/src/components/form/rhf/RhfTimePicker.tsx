import { Controller, useFormContext } from 'react-hook-form';
import { format, isValid, parse } from 'date-fns';
import { useFieldCopy } from './useFieldCopy';
import { TimePicker } from '@/components/ui';
import { useSettings } from '@/hooks/useSettings';

interface RhfTimePickerProps {
  name: string;
  label: string;
  helperText?: string;
  /** Pick a whole hour and store it as a number 0–23 instead of an `HH:mm` string. */
  hoursOnly?: boolean;
}

/** Reads a stored `HH:mm` string (or a 0–23 hour) into a Date for the picker. */
function toTime(value: unknown, hoursOnly: boolean): Date | null {
  if (value === '' || value === null || value === undefined) return null;
  if (hoursOnly) {
    const date = new Date();
    date.setHours(Number(value), 0, 0, 0);
    return date;
  }
  const date = parse(String(value), 'HH:mm', new Date());
  return isValid(date) ? date : null;
}

/**
 * React Hook Form-bound MUIX time picker — a wall-clock time with no date, stored as an
 * `HH:mm` string (or a 0–23 hour with `hoursOnly`). The 12/24-hour clock follows the
 * admin's configured time format (CLAUDE.md rule 11).
 */
export function RhfTimePicker({
  name,
  label,
  helperText,
  hoursOnly = false,
}: Readonly<RhfTimePickerProps>) {
  const { control } = useFormContext();
  const copy = useFieldCopy();
  const { settings } = useSettings();
  const ampm = settings.timeFormat.includes('a');
  const views = hoursOnly ? (['hours'] as const) : (['hours', 'minutes'] as const);
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TimePicker
          label={copy(label)}
          value={toTime(field.value, hoursOnly)}
          ampm={ampm}
          views={views}
          // A half-typed time arrives as an Invalid Date — that is simply "not set yet".
          onChange={(date) => {
            if (!date || !isValid(date)) {
              field.onChange('');
            } else if (hoursOnly) {
              field.onChange(date.getHours());
            } else {
              field.onChange(format(date, 'HH:mm'));
            }
          }}
          slotProps={{
            textField: {
              // Matches RhfTextField, so a field is addressable as input[name="…"].
              name,
              fullWidth: true,
              onBlur: field.onBlur,
              error: Boolean(fieldState.error),
              helperText: copy(fieldState.error?.message ?? helperText),
            },
          }}
        />
      )}
    />
  );
}

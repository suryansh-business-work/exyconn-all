import { vi } from 'vitest';

/**
 * `@react-native-community/datetimepicker`. The inline (iOS) picker is a text box holding the
 * ISO value: `fireEvent.change(box, { target: { value: iso } })` picks a date, an empty value
 * dismisses. The Android dialog is `DateTimePickerAndroid.open`, a spy: call the `onChange`
 * it was given to play the dialog.
 */
export interface DateTimePickerEvent {
  type: 'set' | 'dismissed' | 'neutralButtonPressed';
  nativeEvent: { timestamp?: number };
}

interface Props {
  value: Date;
  mode?: string;
  display?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  onChange?: (event: DateTimePickerEvent, date?: Date) => void;
}

function eventFor(value: string): [DateTimePickerEvent, Date | undefined] {
  if (value === '') {
    return [{ type: 'dismissed', nativeEvent: {} }, undefined];
  }
  const date = new Date(value);
  return [{ type: 'set', nativeEvent: { timestamp: date.getTime() } }, date];
}

export default function DateTimePicker({ value, mode, onChange }: Readonly<Props>) {
  return (
    <input
      aria-label={`date-time-picker-${mode ?? 'date'}`}
      data-testid="date-time-picker"
      defaultValue={value.toISOString()}
      onChange={(event) => onChange?.(...eventFor(event.target.value))}
    />
  );
}

export const DateTimePickerAndroid = {
  open: vi.fn((_options: Props) => undefined),
  dismiss: vi.fn(),
};

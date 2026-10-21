import { vi } from 'vitest';

/**
 * `@react-native-community/datetimepicker`. The inline (iOS) picker is a text box holding the
 * ISO value: `fireEvent.change(box, { target: { value: iso } })` picks a date, an empty value
 * dismisses. As in the library, a pick goes to `onValueChange` when given (else the deprecated
 * `onChange`) and a dismissal to `onDismiss` (else `onChange`). The Android dialog is
 * `DateTimePickerAndroid.open`, a spy: call the listener it was given to play the dialog.
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
  onValueChange?: (event: Pick<DateTimePickerEvent, 'nativeEvent'>, date: Date) => void;
  onDismiss?: () => void;
}

function eventFor(value: string): [DateTimePickerEvent, Date | undefined] {
  if (value === '') {
    return [{ type: 'dismissed', nativeEvent: {} }, undefined];
  }
  const date = new Date(value);
  return [{ type: 'set', nativeEvent: { timestamp: date.getTime() } }, date];
}

function deliver(value: string, props: Readonly<Props>): void {
  const [event, date] = eventFor(value);
  if (date === undefined) {
    if (props.onDismiss) {
      props.onDismiss();
    } else {
      props.onChange?.(event);
    }
  } else if (props.onValueChange) {
    props.onValueChange(event, date);
  } else {
    props.onChange?.(event, date);
  }
}

export default function DateTimePicker(props: Readonly<Props>) {
  return (
    <input
      aria-label={`date-time-picker-${props.mode ?? 'date'}`}
      data-testid="date-time-picker"
      defaultValue={props.value.toISOString()}
      onChange={(event) => deliver(event.target.value, props)}
    />
  );
}

export const DateTimePickerAndroid = {
  open: vi.fn((_options: Props) => undefined),
  dismiss: vi.fn(),
};

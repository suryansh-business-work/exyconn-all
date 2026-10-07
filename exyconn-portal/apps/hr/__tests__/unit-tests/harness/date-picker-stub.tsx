import type { ReactNode } from 'react';

/** The day the stand-in picks: 15 March 2026, local midnight, as the real picker hands it. */
export const PICKED_DAY = new Date(2026, 2, 15);

export interface DatePickerStubProps {
  label: ReactNode;
  value: Date | null;
  minDate?: Date;
  onChange: (next: Date | null) => void;
  slotProps?: { textField?: { helperText?: ReactNode; error?: boolean } };
}

/**
 * Stands in for MUI X's DatePicker (its calendar does not lay out under jsdom): shows the
 * value, the earliest day and the hint it was given, and picks or clears a day on request.
 */
export function DatePickerStub({
  label,
  value,
  minDate,
  onChange,
  slotProps,
}: Readonly<DatePickerStubProps>) {
  const textField = slotProps?.textField;
  return (
    <fieldset>
      <legend>{label}</legend>
      <span>{value ? `value ${value.toISOString()}` : 'no value'}</span>
      {minDate && <span>{`earliest ${minDate.toISOString()}`}</span>}
      {textField?.helperText && <span>{textField.helperText}</span>}
      <button type="button" onClick={() => onChange(PICKED_DAY)}>
        Pick {label}
      </button>
      <button type="button" onClick={() => onChange(null)}>
        Clear {label}
      </button>
    </fieldset>
  );
}

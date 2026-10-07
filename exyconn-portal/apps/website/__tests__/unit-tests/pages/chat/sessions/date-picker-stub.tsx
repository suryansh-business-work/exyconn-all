import type { ReactNode } from 'react';

/** The DatePicker props the chat filters hand over. */
export interface DatePickerStubProps {
  label: string;
  value: Date | null;
  minDate?: Date;
  maxDate?: Date;
  onChange: (next: Date | null) => void;
  slotProps?: { textField?: { error?: boolean; helperText?: ReactNode } };
}

/** The day every stand-in picker "picks". */
export const PICKED_DAY = new Date(2026, 4, 20);

/** The last props each picker rendered with, keyed by its (translated) label. */
export const pickerProps = new Map<string, DatePickerStubProps>();

/**
 * Stands in for MUI X's DatePicker, whose sectioned field cannot be typed into under jsdom:
 * one button picks {@link PICKED_DAY}, another clears, and the helper text shows as an alert.
 */
export function DatePickerStub(props: Readonly<DatePickerStubProps>) {
  pickerProps.set(props.label, props);
  const helperText = props.slotProps?.textField?.helperText;
  return (
    <div>
      <button type="button" onClick={() => props.onChange(PICKED_DAY)}>
        {props.label}
      </button>
      <button type="button" onClick={() => props.onChange(null)}>
        {`Clear ${props.label}`}
      </button>
      {helperText && <p role="alert">{helperText}</p>}
    </div>
  );
}

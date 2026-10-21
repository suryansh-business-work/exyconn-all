interface DatePickerStubProps {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  slotProps?: {
    textField?: { helperText?: string; required?: boolean; onBlur?: () => void };
  };
}

/** What the stub's text box sends: '' clears, 'bad' is a half-typed date, else that local day. */
function typedDate(text: string): Date | null {
  if (text === '') {
    return null;
  }
  return text === 'bad' ? new Date(Number.NaN) : new Date(`${text}T12:00:00`);
}

/**
 * The MUI X date picker reduced to a text box labelled like the picker, for driving a form's
 * own date handling in jsdom. `data-value` shows the day the picker was given.
 */
export function DatePickerStub({
  label,
  value,
  onChange,
  slotProps,
}: Readonly<DatePickerStubProps>) {
  const textField = slotProps?.textField;
  return (
    <>
      <input
        aria-label={label}
        aria-required={textField?.required}
        data-value={value ? value.toDateString() : ''}
        onChange={(event) => onChange(typedDate(event.target.value))}
        onBlur={textField?.onBlur}
      />
      {textField?.helperText && <span>{textField.helperText}</span>}
    </>
  );
}

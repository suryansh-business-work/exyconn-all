import { useController } from 'react-hook-form';

interface DateTimeStubProps {
  name: string;
  label: string;
}

/**
 * Stands in for `RhfDateTimePicker` (MUI X's sectioned field cannot be typed into under jsdom):
 * a plain labelled box bound to the same form field, holding the ISO string the real picker
 * stores, with the field's validation message under it.
 */
export function DateTimeStub({ name, label }: Readonly<DateTimeStubProps>) {
  const { field, fieldState } = useController({ name });
  const id = `stub-${name}`;
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={field.name}
        value={field.value ?? ''}
        onChange={(event) => field.onChange(event.target.value)}
        onBlur={field.onBlur}
      />
      {fieldState.error?.message && <span>{fieldState.error.message}</span>}
    </div>
  );
}

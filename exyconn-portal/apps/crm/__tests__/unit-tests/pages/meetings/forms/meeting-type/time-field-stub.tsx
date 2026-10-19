import { useController } from 'react-hook-form';

/**
 * Stands in for RhfTimePicker in the meeting type form tests: the same field name bound to
 * the form as "HH:mm" text. Fourteen real MUI X pickers make every render take seconds.
 */
export function TimeFieldStub({ name, label }: Readonly<{ name: string; label: string }>) {
  const { field } = useController({ name });
  return (
    <label>
      {label}
      <input name={field.name} value={field.value} onChange={field.onChange} />
    </label>
  );
}

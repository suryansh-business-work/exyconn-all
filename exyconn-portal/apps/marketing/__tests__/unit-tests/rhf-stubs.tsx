import { useController } from 'react-hook-form';
import { TextField } from '@exyconn/shell/components/ui';

interface RhfValueStubProps {
  name: string;
  label: string;
  helperText?: string;
}

/**
 * Stands in for the MUI X pickers and the image upload field: a plain text box bound to the
 * same form value, so a test types the ISO string or URL the real field would store.
 */
export function RhfValueStub({ name, label, helperText }: Readonly<RhfValueStubProps>) {
  const { field, fieldState } = useController({ name });
  return (
    <TextField
      label={label}
      name={name}
      value={field.value ?? ''}
      onChange={(event) => field.onChange(event.target.value)}
      onBlur={field.onBlur}
      error={Boolean(fieldState.error)}
      helperText={fieldState.error?.message ?? helperText}
    />
  );
}

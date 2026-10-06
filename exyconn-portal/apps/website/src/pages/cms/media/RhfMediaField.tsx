import { useController, useFormContext } from 'react-hook-form';
import { MediaUrlInput } from './MediaUrlInput';

interface RhfMediaFieldProps {
  name: string;
  label: string;
  siteId?: string;
  helperText?: string;
}

/** React Hook Form-bound media field: a URL typed in or picked from the site's library. */
export function RhfMediaField({ name, label, siteId, helperText }: Readonly<RhfMediaFieldProps>) {
  const { control } = useFormContext();
  const { field, fieldState } = useController({ name, control });
  return (
    <MediaUrlInput
      label={label}
      value={field.value ?? ''}
      onChange={field.onChange}
      onBlur={field.onBlur}
      siteId={siteId}
      error={fieldState.error?.message}
      helperText={helperText}
    />
  );
}

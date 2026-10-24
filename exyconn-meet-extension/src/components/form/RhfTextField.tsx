import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { TextField } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';

interface Props<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  hint: string;
  type?: 'text' | 'email' | 'password';
  autoComplete?: string;
  autoFocus?: boolean;
}

/** A labelled text field bound to a string field, with hint and error text. */
export function RhfTextField<T extends FieldValues>({
  control,
  name,
  label,
  hint,
  type = 'text',
  autoComplete,
  autoFocus = false,
}: Readonly<Props<T>>) {
  const t = useT();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          fullWidth
          size="small"
          id={name}
          type={type}
          label={t(label)}
          name={field.name}
          value={field.value}
          inputRef={field.ref}
          onBlur={field.onBlur}
          onChange={(event) => field.onChange(event.target.value)}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          error={fieldState.error !== undefined}
          helperText={t(fieldState.error?.message ?? hint)}
        />
      )}
    />
  );
}

import { Controller, useFormContext } from 'react-hook-form';
import { TextField, type TextFieldProps } from '@exyconn/ui';

type FormTextFieldProps = Omit<TextFieldProps, 'name' | 'value' | 'onChange' | 'error'> & {
  name: string;
};

/**
 * A TextField bound to the surrounding React Hook Form. The editor's dialogs use it
 * rather than the shell's RhfTextField because the shell depends on this package.
 */
export function FormTextField({ name, helperText, ...props }: Readonly<FormTextFieldProps>) {
  const { control } = useFormContext();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...props}
          {...field}
          fullWidth
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message ?? helperText}
        />
      )}
    />
  );
}

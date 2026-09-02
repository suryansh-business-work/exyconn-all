import { Controller, useFormContext } from 'react-hook-form';
import { TextField, type TextFieldProps } from '@/components/ui';

type RhfTextFieldProps = { name: string } & Omit<TextFieldProps, 'name' | 'error' | 'defaultValue'>;

/** React Hook Form-bound MUI text field with inline validation feedback. */
export function RhfTextField({ name, helperText, ...props }: RhfTextFieldProps) {
  const { control } = useFormContext();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...props}
          {...field}
          value={field.value ?? ''}
          fullWidth
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message ?? helperText}
        />
      )}
    />
  );
}

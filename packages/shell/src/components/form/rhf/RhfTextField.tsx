import { Controller, useFormContext } from 'react-hook-form';
import { useFieldCopy } from './useFieldCopy';
import { TextField, type TextFieldProps } from '@/components/ui';

type RhfTextFieldProps = { name: string } & Omit<TextFieldProps, 'name' | 'error' | 'defaultValue'>;

/** React Hook Form-bound MUI text field with inline validation feedback. */
export function RhfTextField({ name, label, helperText, ...props }: RhfTextFieldProps) {
  const { control } = useFormContext();
  const copy = useFieldCopy();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...props}
          {...field}
          label={copy(label)}
          value={field.value ?? ''}
          fullWidth
          error={Boolean(fieldState.error)}
          helperText={copy(fieldState.error?.message ?? helperText)}
        />
      )}
    />
  );
}

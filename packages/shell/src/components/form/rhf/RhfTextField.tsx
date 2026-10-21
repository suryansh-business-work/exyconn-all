import { Controller, useFormContext } from 'react-hook-form';
import { useFieldCopy } from './useFieldCopy';
import { useFieldMeta } from './useFieldMeta';
import { TextField, type TextFieldProps } from '@/components/ui';

type RhfTextFieldProps = { name: string } & Omit<TextFieldProps, 'name' | 'error' | 'defaultValue'>;

/** React Hook Form-bound MUI text field with inline validation feedback. */
export function RhfTextField({ name, label, helperText, required, ...props }: RhfTextFieldProps) {
  const { control } = useFormContext();
  const meta = useFieldMeta(name, { required, helperText });
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
          required={meta.required}
          error={Boolean(fieldState.error)}
          helperText={copy(fieldState.error?.message ?? meta.helperText)}
        />
      )}
    />
  );
}

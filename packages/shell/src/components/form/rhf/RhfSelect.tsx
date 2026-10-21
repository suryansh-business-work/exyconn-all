import { Controller, useFormContext } from 'react-hook-form';
import { useFieldCopy } from './useFieldCopy';
import { useFieldMeta } from './useFieldMeta';
import { MenuItem, TextField } from '@/components/ui';
import type { SelectOption } from './types';

interface RhfSelectProps {
  name: string;
  label: string;
  options: SelectOption[];
  helperText?: string;
  /** Marks the label with the required star; Zod still owns the rule. */
  required?: boolean;
}

/** React Hook Form-bound MUI select with inline validation feedback. */
export function RhfSelect({
  name,
  label,
  options,
  helperText,
  required,
}: Readonly<RhfSelectProps>) {
  const { control } = useFormContext();
  const meta = useFieldMeta(name, { required, helperText });
  const copy = useFieldCopy();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          value={field.value ?? ''}
          select
          fullWidth
          label={copy(label)}
          required={meta.required}
          error={Boolean(fieldState.error)}
          helperText={copy(fieldState.error?.message ?? meta.helperText)}
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      )}
    />
  );
}

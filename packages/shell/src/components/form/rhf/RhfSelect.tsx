import { Controller, useFormContext } from 'react-hook-form';
import { MenuItem, TextField } from '@/components/ui';
import type { SelectOption } from './types';

interface RhfSelectProps {
  name: string;
  label: string;
  options: SelectOption[];
  helperText?: string;
}

/** React Hook Form-bound MUI select with inline validation feedback. */
export function RhfSelect({ name, label, options, helperText }: RhfSelectProps) {
  const { control } = useFormContext();
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
          label={label}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message ?? helperText}
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

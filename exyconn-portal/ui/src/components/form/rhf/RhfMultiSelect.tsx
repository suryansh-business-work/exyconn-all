import { Controller, useFormContext } from 'react-hook-form';
import { Box, Chip, MenuItem, TextField } from '@/components/ui';
import type { SelectOption } from './types';

interface RhfMultiSelectProps {
  name: string;
  label: string;
  options: SelectOption[];
  helperText?: string;
}

/** React Hook Form-bound MUI multi-select rendering selected values as chips. */
export function RhfMultiSelect({ name, label, options, helperText }: RhfMultiSelectProps) {
  const { control } = useFormContext();
  const labelFor = (value: string) => options.find((o) => o.value === value)?.label ?? value;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          select
          fullWidth
          label={label}
          name={field.name}
          value={(field.value as string[]) ?? []}
          onChange={field.onChange}
          onBlur={field.onBlur}
          inputRef={field.ref}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message ?? helperText}
          SelectProps={{
            multiple: true,
            renderValue: (selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {(selected as string[]).map((value) => (
                  <Chip key={value} label={labelFor(value)} size="small" />
                ))}
              </Box>
            ),
          }}
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

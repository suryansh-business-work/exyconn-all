import { Controller, useFormContext } from 'react-hook-form';
import { useFieldCopy } from './useFieldCopy';
import { useFieldMeta } from './useFieldMeta';
import { Box, Chip, MenuItem, TextField } from '@/components/ui';
import type { SelectOption } from './types';

interface RhfMultiSelectProps {
  name: string;
  label: string;
  options: SelectOption[];
  helperText?: string;
  /** Marks the label with the required star; by default the schema decides. */
  required?: boolean;
}

/** React Hook Form-bound MUI multi-select rendering selected values as chips. */
export function RhfMultiSelect({
  name,
  label,
  options,
  helperText,
  required,
}: Readonly<RhfMultiSelectProps>) {
  const { control } = useFormContext();
  const meta = useFieldMeta(name, { required, helperText });
  const copy = useFieldCopy();
  const labelFor = (value: string) => options.find((o) => o.value === value)?.label ?? value;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          select
          fullWidth
          required={meta.required}
          label={copy(label)}
          name={field.name}
          value={(field.value as string[]) ?? []}
          onChange={field.onChange}
          onBlur={field.onBlur}
          inputRef={field.ref}
          error={Boolean(fieldState.error)}
          helperText={copy(fieldState.error?.message ?? meta.helperText)}
          slotProps={{
            select: {
              multiple: true,
              renderValue: (selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((value) => (
                    <Chip key={value} label={labelFor(value)} size="small" />
                  ))}
                </Box>
              ),
            },
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

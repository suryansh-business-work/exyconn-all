import { Controller, useFormContext } from 'react-hook-form';
import { Autocomplete, TextField } from '@/components/ui';
import type { SelectOption } from './types';

interface RhfAutocompleteProps {
  name: string;
  label: string;
  options: SelectOption[];
  helperText?: string;
}

/** React Hook Form-bound MUI Autocomplete — a searchable single-select. */
export function RhfAutocomplete({ name, label, options, helperText }: RhfAutocompleteProps) {
  const { control } = useFormContext();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const selected = options.find((o) => o.value === field.value) ?? null;
        return (
          <Autocomplete
            options={options}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, value) => option.value === value.value}
            value={selected}
            onChange={(_e, option) => field.onChange(option ? option.value : '')}
            onBlur={field.onBlur}
            renderInput={(params) => (
              <TextField
                {...params}
                label={label}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message ?? helperText}
              />
            )}
          />
        );
      }}
    />
  );
}

import { Controller, useFormContext } from 'react-hook-form';
import { useFieldCopy } from './useFieldCopy';
import { useFieldMeta } from './useFieldMeta';
import { Autocomplete, TextField } from '@/components/ui';
import type { SelectOption } from './types';

interface RhfAutocompleteProps {
  name: string;
  label: string;
  options: SelectOption[];
  helperText?: string;
  /** Marks the label with the required star; Zod still owns the rule. */
  required?: boolean;
}

/** React Hook Form-bound MUI Autocomplete — a searchable single-select. */
export function RhfAutocomplete({
  name,
  label,
  options,
  helperText,
  required,
}: Readonly<RhfAutocompleteProps>) {
  const { control } = useFormContext();
  const meta = useFieldMeta(name, { required, helperText });
  const copy = useFieldCopy();
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
                // Matches RhfTextField/RhfSelect, so a field is addressable as
                // input[name="…"] rather than by its rendered value.
                name={name}
                label={copy(label)}
                required={meta.required}
                error={Boolean(fieldState.error)}
                helperText={copy(fieldState.error?.message ?? meta.helperText)}
              />
            )}
          />
        );
      }}
    />
  );
}

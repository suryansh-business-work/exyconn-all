import { Controller, useFormContext } from 'react-hook-form';
import { Autocomplete, Chip, TextField } from '@/components/ui';

interface RhfChipsInputProps {
  name: string;
  label: string;
  helperText?: string;
}

/**
 * React Hook Form-bound free-form chip input backed by a `string[]` — type a value
 * and press Enter to add it. Unlike RhfMultiSelect there is no fixed option list, so
 * this is what open-ended lists (tags, skills, requirements, deliverables) use.
 */
export function RhfChipsInput({ name, label, helperText }: Readonly<RhfChipsInputProps>) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Autocomplete
          multiple
          freeSolo
          options={[] as string[]}
          value={(field.value as string[]) ?? []}
          onChange={(_event, value) => field.onChange(value)}
          onBlur={field.onBlur}
          renderTags={(value: readonly string[], getTagProps) =>
            value.map((option, index) => {
              const { key, ...tagProps } = getTagProps({ index });
              return <Chip key={key} label={option} size="small" {...tagProps} />;
            })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message ?? helperText ?? 'Type a value and press Enter'}
            />
          )}
        />
      )}
    />
  );
}

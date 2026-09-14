import { Controller, useFormContext } from 'react-hook-form';
import { useFieldCopy } from './useFieldCopy';
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
  const copy = useFieldCopy();

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
          // MUI 9 renamed `renderTags` to `renderValue`; the item props arrive the same way.
          renderValue={(value, getItemProps) =>
            value.map((option, index) => {
              const { key, ...itemProps } = getItemProps({ index });
              return <Chip key={key} label={option} size="small" {...itemProps} />;
            })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label={copy(label)}
              error={Boolean(fieldState.error)}
              helperText={copy(
                fieldState.error?.message ?? helperText ?? 'Type a value and press Enter',
              )}
            />
          )}
        />
      )}
    />
  );
}

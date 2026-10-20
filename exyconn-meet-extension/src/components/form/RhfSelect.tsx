import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { MenuItem, TextField } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';

export interface SelectOption {
  value: string;
  /** English source string. */
  label: string;
  values?: Readonly<Record<string, string | number>>;
}

interface Props<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  hint: string;
  options: readonly SelectOption[];
}

/** A labelled single-choice select bound to a string field, with hint and error text. */
export function RhfSelect<T extends FieldValues>({
  control,
  name,
  label,
  hint,
  options,
}: Readonly<Props<T>>) {
  const t = useT();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          select
          fullWidth
          id={name}
          label={t(label)}
          name={field.name}
          value={field.value}
          inputRef={field.ref}
          onBlur={field.onBlur}
          onChange={(event) => field.onChange(event.target.value)}
          error={fieldState.error !== undefined}
          helperText={t(fieldState.error?.message ?? hint)}
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {t(option.label, option.values)}
            </MenuItem>
          ))}
        </TextField>
      )}
    />
  );
}

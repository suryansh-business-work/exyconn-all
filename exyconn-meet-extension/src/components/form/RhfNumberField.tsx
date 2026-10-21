import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { TextField } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';

interface Props<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  hint: string;
  min: number;
  max: number;
}

/**
 * A whole-number field. An empty box is sent as NaN so the schema reports "enter a number"
 * instead of silently saving zero.
 */
export function RhfNumberField<T extends FieldValues>({
  control,
  name,
  label,
  hint,
  min,
  max,
}: Readonly<Props<T>>) {
  const t = useT();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          fullWidth
          id={name}
          type="number"
          label={t(label)}
          name={field.name}
          value={Number.isNaN(field.value) ? '' : field.value}
          inputRef={field.ref}
          onBlur={field.onBlur}
          onChange={(event) =>
            field.onChange(event.target.value === '' ? Number.NaN : Number(event.target.value))
          }
          error={fieldState.error !== undefined}
          helperText={t(fieldState.error?.message ?? hint)}
          slotProps={{ htmlInput: { min, max, step: 1, inputMode: 'numeric' } }}
        />
      )}
    />
  );
}

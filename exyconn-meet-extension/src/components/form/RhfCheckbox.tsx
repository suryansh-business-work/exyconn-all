import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { Checkbox, FormControlLabel } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';

interface Props<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  disabled?: boolean;
}

/** A labelled checkbox bound to a boolean field. */
export function RhfCheckbox<T extends FieldValues>({
  control,
  name,
  label,
  disabled,
}: Readonly<Props<T>>) {
  const t = useT();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FormControlLabel
          label={t(label)}
          disabled={disabled}
          control={
            <Checkbox
              size="small"
              name={field.name}
              checked={field.value === true}
              onBlur={field.onBlur}
              onChange={(_event, checked) => field.onChange(checked)}
              slotProps={{ input: { ref: field.ref } }}
            />
          }
        />
      )}
    />
  );
}

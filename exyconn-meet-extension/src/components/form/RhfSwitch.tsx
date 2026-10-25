import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { FormControl, FormControlLabel, FormHelperText, Switch } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';

interface Props<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  hint: string;
  disabled?: boolean;
}

/** A labelled switch bound to a boolean field, with its hint and any error under it. */
export function RhfSwitch<T extends FieldValues>({
  control,
  name,
  label,
  hint,
  disabled,
}: Readonly<Props<T>>) {
  const t = useT();
  const hintId = `${name}-hint`;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormControl error={fieldState.error !== undefined} disabled={disabled}>
          <FormControlLabel
            label={t(label)}
            control={
              <Switch
                name={field.name}
                checked={field.value === true}
                onBlur={field.onBlur}
                slotProps={{ input: { ref: field.ref, 'aria-describedby': hintId } }}
                onChange={(_event, checked) => field.onChange(checked)}
              />
            }
          />
          <FormHelperText id={hintId}>{t(fieldState.error?.message ?? hint)}</FormHelperText>
        </FormControl>
      )}
    />
  );
}

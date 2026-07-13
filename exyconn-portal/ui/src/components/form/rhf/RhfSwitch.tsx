import { Controller, useFormContext } from 'react-hook-form';
import { FormControlLabel, Switch } from '@/components/ui';

interface RhfSwitchProps {
  name: string;
  label: string;
}

/** React Hook Form-bound MUI switch for a boolean field. */
export function RhfSwitch({ name, label }: Readonly<RhfSwitchProps>) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <FormControlLabel
          label={label}
          control={
            <Switch
              checked={Boolean(field.value)}
              onChange={(event) => field.onChange(event.target.checked)}
              onBlur={field.onBlur}
              name={field.name}
            />
          }
        />
      )}
    />
  );
}

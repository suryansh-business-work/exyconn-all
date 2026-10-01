import { Controller, useFormContext } from 'react-hook-form';
import { useFieldCopy } from './useFieldCopy';
import { Box, FormControlLabel, FormHelperText, Switch } from '@/components/ui';

interface RhfSwitchProps {
  name: string;
  label: string;
}

/**
 * React Hook Form-bound MUI switch for a boolean field.
 *
 * It shows its own error, as every other field here does. A switch that a schema requires —
 * agreeing to a contract, confirming a destructive change — otherwise blocks the submit in
 * silence: the button appears to do nothing and nobody is told what is missing.
 */
export function RhfSwitch({ name, label }: Readonly<RhfSwitchProps>) {
  const { control } = useFormContext();
  const copy = useFieldCopy();
  const errorId = `${name}-error`;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Box>
          <FormControlLabel
            label={copy(label)}
            control={
              <Switch
                checked={Boolean(field.value)}
                onChange={(event) => field.onChange(event.target.checked)}
                onBlur={field.onBlur}
                name={field.name}
                slotProps={{
                  input: { 'aria-describedby': fieldState.error ? errorId : undefined },
                }}
              />
            }
          />
          {fieldState.error?.message && (
            // role="alert" so it is announced when it appears, which is on submit.
            <FormHelperText id={errorId} error role="alert">
              {copy(fieldState.error.message)}
            </FormHelperText>
          )}
        </Box>
      )}
    />
  );
}

import { Controller, useFormContext } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import { MenuItem, TextField } from '@exyconn/shell/components/ui';
import { ProviderLabel } from '../../../integrations/ProviderLogo';

interface RhfProviderSelectProps {
  /** The provider enum values to offer, in order. */
  providers: readonly string[];
  /** What the choice is for, shown under the field until there is an error. */
  helperText?: string;
}

/** The "Provider" select of a channel's account form: each option shows the logo and name. */
export function RhfProviderSelect({ providers, helperText }: Readonly<RhfProviderSelectProps>) {
  const { control } = useFormContext();
  const t = useT();
  const hint = helperText ? t(helperText) : undefined;
  return (
    <Controller
      name="provider"
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          value={field.value ?? ''}
          select
          fullWidth
          label={t('Provider')}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message ? t(fieldState.error.message) : hint}
        >
          {providers.map((provider) => (
            <MenuItem key={provider} value={provider}>
              <ProviderLabel provider={provider} />
            </MenuItem>
          ))}
        </TextField>
      )}
    />
  );
}

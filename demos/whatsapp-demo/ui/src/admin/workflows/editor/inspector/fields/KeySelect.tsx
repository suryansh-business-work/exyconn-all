import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import { ListItemIcon, MenuItem, TextField } from '@exyconn/shell/components/ui';
import { WA_ICONS } from '../../../../../components/wa/icons';
import type { IconKey } from '@exyconn/wa-flow';

interface KeySelectProps {
  name: string;
  /** English source, translated here. */
  label: string;
  keys: readonly string[];
  /** Translate each option (true for words like "pending"; false for names like icon keys). */
  translate?: boolean;
  /** Draw the matching WhatsApp icon beside each option (for `ICON_KEYS`). */
  icons?: boolean;
  hint?: string;
  /** Offers "not set" as the first option, stored as `undefined`. */
  emptyLabel?: string;
}

/** A select over a fixed list of schema keys (icons, accents, kinds, operators). */
export function KeySelect({
  name,
  label,
  keys,
  translate = false,
  icons = false,
  hint,
  emptyLabel,
}: Readonly<KeySelectProps>) {
  const t = useT();
  const { control } = useFormContext();
  // Read without a fallback: a Controller's `field.value` falls back to the default value once
  // "not set" is picked (stored as `undefined`), which would keep showing the old option.
  const value = useWatch({ control, name }) as string | undefined;
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const message = fieldState.error?.message ?? hint;
        return (
          <TextField
            {...field}
            value={value ?? ''}
            onChange={(event) =>
              field.onChange(event.target.value === '' ? undefined : event.target.value)
            }
            select
            size="small"
            fullWidth
            label={t(label)}
            error={Boolean(fieldState.error)}
            helperText={message ? t(message) : undefined}
          >
            {emptyLabel && <MenuItem value="">{t(emptyLabel)}</MenuItem>}
            {keys.map((key) => {
              const Icon = icons ? WA_ICONS[key as IconKey] : undefined;
              return (
                <MenuItem key={key} value={key}>
                  {Icon && (
                    <ListItemIcon>
                      <Icon fontSize="small" />
                    </ListItemIcon>
                  )}
                  {translate ? t(key) : key}
                </MenuItem>
              );
            })}
          </TextField>
        );
      }}
    />
  );
}

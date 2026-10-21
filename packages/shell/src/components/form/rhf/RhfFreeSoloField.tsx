import { useT } from '@exyconn/i18n';
import { Controller, useFormContext } from 'react-hook-form';
import { useFieldCopy } from './useFieldCopy';
import { useFieldMeta } from './useFieldMeta';
import { Autocomplete, TextField } from '@/components/ui';

interface RhfFreeSoloFieldProps {
  name: string;
  label: string;
  /** The suggestions; anything else typed is kept as it is. */
  options: readonly string[];
  helperText?: string;
  /** Marks the label with the required star; by default the schema decides. */
  required?: boolean;
  /** Shown in the list while the suggestions load. */
  loading?: boolean;
  /** Why the suggestions could not be loaded; shown as the hint, typing still works. */
  optionsError?: string;
}

/** The suggestions that contain what was typed, then the typed text itself when it is new. */
function suggest(options: readonly string[], typed: string): string[] {
  const query = typed.trim().toLowerCase();
  if (query === '') {
    return [...options];
  }
  const matches = options.filter((option) => option.toLowerCase().includes(query));
  const known = options.some((option) => option.toLowerCase() === query);
  return known ? matches : [...matches, typed.trim()];
}

/**
 * React Hook Form-bound free-solo MUI Autocomplete backed by a `string`: typing filters the
 * suggestions, and whatever is typed is the value, so a name missing from the list can still
 * be used. A typed name that is not in the list is offered as `Use "…"`.
 */
export function RhfFreeSoloField({
  name,
  label,
  options,
  helperText,
  required,
  loading,
  optionsError,
}: Readonly<RhfFreeSoloFieldProps>) {
  const { control } = useFormContext();
  const meta = useFieldMeta(name, { required, helperText });
  const copy = useFieldCopy();
  const t = useT();
  // Translated here, once: the server's reason is part of the text, not a catalogue key.
  const hint = optionsError
    ? t('{error} You can still type a name.', { error: optionsError })
    : copy(meta.helperText);
  const known = new Set(options);
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Autocomplete
          freeSolo
          options={options}
          value={(field.value as string) ?? ''}
          inputValue={(field.value as string) ?? ''}
          onInputChange={(_event, value) => field.onChange(value)}
          onChange={(_event, value) => field.onChange(value ?? '')}
          onBlur={field.onBlur}
          filterOptions={(list, state) => suggest(list, state.inputValue)}
          loading={loading}
          loadingText={t('Loading…')}
          renderOption={(props, option) => {
            const { key, ...optionProps } = props;
            const text = known.has(option) ? option : t('Use "{value}"', { value: option });
            return (
              <li key={key} {...optionProps}>
                {text}
              </li>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              // Matches RhfTextField, so the field is addressable as input[name="…"].
              name={name}
              label={copy(label)}
              required={meta.required}
              error={Boolean(fieldState.error)}
              helperText={fieldState.error ? copy(fieldState.error.message) : hint}
            />
          )}
        />
      )}
    />
  );
}

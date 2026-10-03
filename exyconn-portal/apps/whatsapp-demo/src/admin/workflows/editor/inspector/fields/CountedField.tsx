import { Controller, useFormContext } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import { Box, TextField } from '@exyconn/shell/components/ui';

interface CountedFieldProps {
  name: string;
  /** English source, translated here. */
  label: string;
  /** WhatsApp's limit for this text; shows a live `n/max` counter. */
  max?: number;
  hint?: string;
  multiline?: boolean;
  disabled?: boolean;
}

/**
 * A text field bound to the inspector form, with the error or hint underneath and a running
 * character count against WhatsApp's own limit, so an author sees a title is too long while
 * typing rather than at Publish.
 */
export function CountedField({
  name,
  label,
  max,
  hint,
  multiline = false,
  disabled = false,
}: Readonly<CountedFieldProps>) {
  const t = useT();
  const { control } = useFormContext();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const value = typeof field.value === 'string' ? field.value : String(field.value ?? '');
        const message = fieldState.error?.message ?? hint;
        const over = max !== undefined && value.length > max;
        return (
          <TextField
            {...field}
            value={value}
            label={t(label)}
            size="small"
            fullWidth
            disabled={disabled}
            multiline={multiline}
            minRows={multiline ? 2 : undefined}
            error={Boolean(fieldState.error) || over}
            helperText={
              <Box
                component="span"
                sx={{ display: 'flex', gap: 1, justifyContent: 'space-between' }}
              >
                <span>{message ? t(message) : ''}</span>
                {max !== undefined && (
                  <span aria-live="polite">{t('{count}/{max}', { count: value.length, max })}</span>
                )}
              </Box>
            }
          />
        );
      }}
    />
  );
}

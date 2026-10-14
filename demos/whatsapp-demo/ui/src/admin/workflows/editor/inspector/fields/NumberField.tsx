import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import { TextField } from '@exyconn/shell/components/ui';

interface NumberFieldProps {
  name: string;
  label: string;
  hint?: string;
  /**
   * A price may also be a `{{var}}` template holding one: the field keeps numbers as numbers
   * and anything else as text, which is what the schema's `number | template` accepts.
   */
  allowTemplate?: boolean;
  step?: number;
}

function parse(raw: string, allowTemplate: boolean): number | string | undefined {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return undefined;
  }
  const value = Number(trimmed);
  if (Number.isFinite(value)) {
    return value;
  }
  return allowTemplate ? raw : Number.NaN;
}

/** A numeric field bound to the inspector form; empty means "not set". */
export function NumberField({
  name,
  label,
  hint,
  allowTemplate = false,
  step,
}: Readonly<NumberFieldProps>) {
  const t = useT();
  const { control } = useFormContext();
  // Read without a fallback: a Controller's `field.value` falls back to the default value once
  // the field is emptied (stored as `undefined`), which would put the old number back.
  const value = useWatch({ control, name }) as number | string | undefined;
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const message = fieldState.error?.message ?? hint;
        return (
          <TextField
            name={field.name}
            inputRef={field.ref}
            onBlur={field.onBlur}
            value={value ?? ''}
            onChange={(event) => field.onChange(parse(event.target.value, allowTemplate))}
            label={t(label)}
            size="small"
            fullWidth
            type={allowTemplate ? 'text' : 'number'}
            slotProps={{ htmlInput: { step, inputMode: allowTemplate ? 'text' : 'decimal' } }}
            error={Boolean(fieldState.error)}
            helperText={message ? t(message) : undefined}
          />
        );
      }}
    />
  );
}

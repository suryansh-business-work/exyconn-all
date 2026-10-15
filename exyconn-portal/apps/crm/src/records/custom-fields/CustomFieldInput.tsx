import { Controller, useFormContext, type ControllerFieldState } from 'react-hook-form';
import { format, isValid, parseISO } from 'date-fns';
import { useT } from '@exyconn/i18n';
import { DatePicker, MenuItem, TextField } from '@exyconn/shell/components/ui';
import { CrmPropertyType } from '@exyconn/shell/graphql/generated';
import type { CustomPropertyDef } from './custom-fields.schema';

/** How a DATE value is kept in the form and sent: the calendar day, with no time or zone. */
const ISO_DAY = 'yyyy-MM-dd';

/** The native input type each text-like property type gets, for the right phone keyboard. */
const INPUT_TYPES: Partial<Record<CrmPropertyType, string>> = {
  [CrmPropertyType.Email]: 'email',
  [CrmPropertyType.Phone]: 'tel',
  [CrmPropertyType.Url]: 'url',
  [CrmPropertyType.Number]: 'number',
};

interface FieldProps {
  property: CustomPropertyDef;
  /** The form path, `custom.<key>`. */
  name: string;
}

/**
 * The hint under a field: the error when there is one, else the property's help text. The
 * label and help text are the company's own words, so they are shown as typed; the error is
 * one of the form's English sources and is translated.
 */
function useHint() {
  const t = useT();
  return (property: CustomPropertyDef, fieldState: ControllerFieldState) =>
    fieldState.error?.message ? t(fieldState.error.message) : property.description;
}

function CustomTextInput({ property, name }: Readonly<FieldProps>) {
  const { control } = useFormContext();
  const hint = useHint();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          value={field.value ?? ''}
          type={INPUT_TYPES[property.type] ?? 'text'}
          label={property.label}
          required={property.required}
          fullWidth
          error={Boolean(fieldState.error)}
          helperText={hint(property, fieldState)}
        />
      )}
    />
  );
}

/** A dropdown (ENUM) or a Yes/No: both pick one value, and an optional one can be cleared. */
function CustomChoiceInput({ property, name }: Readonly<FieldProps>) {
  const t = useT();
  const { control } = useFormContext();
  const hint = useHint();
  const choices =
    property.type === CrmPropertyType.Boolean
      ? [
          { value: 'true', label: t('Yes') },
          { value: 'false', label: t('No') },
        ]
      : property.options;
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          value={field.value ?? ''}
          select
          label={property.label}
          required={property.required}
          fullWidth
          error={Boolean(fieldState.error)}
          helperText={hint(property, fieldState)}
        >
          {!property.required && <MenuItem value="">{t('Not set')}</MenuItem>}
          {choices.map((choice) => (
            <MenuItem key={choice.value} value={choice.value}>
              {choice.label}
            </MenuItem>
          ))}
        </TextField>
      )}
    />
  );
}

const toPickerDate = (value: unknown): Date | null => {
  const date = typeof value === 'string' && value !== '' ? parseISO(value) : null;
  return date && isValid(date) ? date : null;
};

function CustomDateInput({ property, name }: Readonly<FieldProps>) {
  const { control } = useFormContext();
  const hint = useHint();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <DatePicker
          label={property.label}
          value={toPickerDate(field.value)}
          // A half-typed date arrives as an Invalid Date; it is "not set yet", never a crash.
          onChange={(date) => field.onChange(date && isValid(date) ? format(date, ISO_DAY) : '')}
          slotProps={{
            textField: {
              name,
              required: property.required,
              fullWidth: true,
              onBlur: field.onBlur,
              error: Boolean(fieldState.error),
              helperText: hint(property, fieldState),
            },
          }}
        />
      )}
    />
  );
}

/** One custom property's input, chosen by its type and bound to `custom.<key>`. */
export function CustomFieldInput({ property, name }: Readonly<FieldProps>) {
  switch (property.type) {
    case CrmPropertyType.Date:
      return <CustomDateInput property={property} name={name} />;
    case CrmPropertyType.Enum:
    case CrmPropertyType.Boolean:
      return <CustomChoiceInput property={property} name={name} />;
    default:
      return <CustomTextInput property={property} name={name} />;
  }
}

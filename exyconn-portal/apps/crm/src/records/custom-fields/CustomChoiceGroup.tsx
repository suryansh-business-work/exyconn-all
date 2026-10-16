import { Controller, useFormContext } from 'react-hook-form';
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
} from '@exyconn/shell/components/ui';
import { CrmPropertyType } from '@exyconn/shell/graphql/generated';
import { MULTI_SEPARATOR } from './custom-fields.schema';
import { useHint, type FieldProps } from './field-hint';

/** The chosen values of a multi-select, in the form's one-string shape. */
const chosenOf = (value: unknown) =>
  new Set(typeof value === 'string' && value !== '' ? value.split(MULTI_SEPARATOR) : []);

/**
 * Radio buttons (one choice, all shown) or checkboxes (any number of choices). The choices are
 * kept in the property's own order, whatever order they were ticked in.
 */
export function CustomChoiceGroup({ property, name }: Readonly<FieldProps>) {
  const { control } = useFormContext();
  const hint = useHint();
  const labelId = `${name}-label`;
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const chosen = chosenOf(field.value);
        const toggle = (value: string) => {
          const next = new Set(chosen);
          if (next.has(value)) {
            next.delete(value);
          } else {
            next.add(value);
          }
          const ordered = property.options.map((o) => o.value).filter((v) => next.has(v));
          field.onChange(ordered.join(MULTI_SEPARATOR));
        };
        return (
          <FormControl
            required={property.required}
            error={Boolean(fieldState.error)}
            onBlur={field.onBlur}
          >
            <FormLabel id={labelId}>{property.label}</FormLabel>
            {property.type === CrmPropertyType.Radio ? (
              <RadioGroup
                aria-labelledby={labelId}
                value={field.value ?? ''}
                onChange={(event) => field.onChange(event.target.value)}
              >
                {property.options.map((option) => (
                  <FormControlLabel
                    key={option.value}
                    value={option.value}
                    control={<Radio />}
                    label={option.label}
                  />
                ))}
              </RadioGroup>
            ) : (
              <FormGroup aria-labelledby={labelId}>
                {property.options.map((option) => (
                  <FormControlLabel
                    key={option.value}
                    control={
                      <Checkbox
                        checked={chosen.has(option.value)}
                        onChange={() => toggle(option.value)}
                      />
                    }
                    label={option.label}
                  />
                ))}
              </FormGroup>
            )}
            <FormHelperText>{hint(property, fieldState)}</FormHelperText>
          </FormControl>
        );
      }}
    />
  );
}

import { Controller, useFormContext } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
} from '@exyconn/shell/components/ui';
import type { CrmObject } from '@exyconn/shell/graphql/generated';
import { PROPERTY_OBJECTS } from '../../property-types';
import type { CrmPropertyFormValues } from './crm-property.types';

const ALL_OBJECTS = PROPERTY_OBJECTS.map(({ object }) => object);
const LABEL_ID = 'crm-property-objects-label';

/** The chosen types after one is ticked or unticked, in the settings tabs' order. */
const toggled = (chosen: readonly CrmObject[], object: CrmObject): CrmObject[] => {
  const next = new Set(chosen);
  if (next.has(object)) {
    next.delete(object);
  } else {
    next.add(object);
  }
  return ALL_OBJECTS.filter((item) => next.has(item));
};

/**
 * Which record types a new property is added to: any of leads, companies and contacts, or all of
 * them at once. Each type gets its own copy, which can then be edited on that type's tab.
 */
export function CrmPropertyObjectsFields() {
  const t = useT();
  const { control } = useFormContext<CrmPropertyFormValues>();
  return (
    <Controller
      name="objects"
      control={control}
      render={({ field, fieldState }) => {
        const chosen: CrmObject[] = field.value;
        const all = chosen.length === ALL_OBJECTS.length;
        const some = chosen.length > 0 && !all;
        const hint =
          fieldState.error?.message ??
          'Each record type gets its own copy, which you can then change on its tab.';
        return (
          <FormControl
            component="fieldset"
            error={Boolean(fieldState.error)}
            onBlur={field.onBlur}
            data-cy="crm-property-objects"
          >
            <FormLabel component="legend" id={LABEL_ID}>
              {t('Applies to')}
            </FormLabel>
            <FormGroup aria-labelledby={LABEL_ID} row>
              <FormControlLabel
                label={t('All record types')}
                control={
                  <Checkbox
                    name="objects-all"
                    checked={all}
                    indeterminate={some}
                    onChange={() => field.onChange(all ? [] : ALL_OBJECTS)}
                  />
                }
              />
              {PROPERTY_OBJECTS.map(({ object, label }) => (
                <FormControlLabel
                  key={object}
                  label={t(label)}
                  control={
                    <Checkbox
                      name={`objects-${object}`}
                      checked={chosen.includes(object)}
                      onChange={() => field.onChange(toggled(chosen, object))}
                    />
                  }
                />
              ))}
            </FormGroup>
            <FormHelperText>{t(hint)}</FormHelperText>
          </FormControl>
        );
      }}
    />
  );
}

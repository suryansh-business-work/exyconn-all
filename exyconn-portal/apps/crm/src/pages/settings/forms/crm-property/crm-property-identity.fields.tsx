import { useEffect } from 'react';
import { useFormContext, useFormState, useWatch } from 'react-hook-form';
import AutoModeIcon from '@mui/icons-material/AutoMode';
import { useT } from '@exyconn/i18n';
import { InputAdornment, TextField } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { PROPERTY_TYPE_LABELS } from '../../property-types';
import { CHOICE_TYPES } from '../../../../records/schema';
import { keyFromLabel } from './crm-property.key';
import { CrmPropertyObjectsFields } from './crm-property-objects.fields';
import { CrmPropertyOptionsFields } from './crm-property-options.fields';
import { CrmPropertyTypeSelect } from './crm-property-type.select';
import type { CrmPropertyFormValues } from './crm-property.types';

const KEY_HINT = 'Used in imports, exports and the API. It cannot change once saved.';
const AUTO_KEY_HINT =
  'Made from the label as you type; edit it to choose your own. Used in imports, exports and the API, and fixed once saved.';

/**
 * Keeps a new property's key in step with its label until somebody edits the key. Once the key
 * has been visited it is re-checked with each change, so an "Enter a key" shown while it was
 * empty clears as soon as the label fills it in.
 */
function useKeyFromLabel(enabled: boolean): boolean {
  const { control, getFieldState, setValue } = useFormContext<CrmPropertyFormValues>();
  const label = useWatch({ control, name: 'label' });
  const { dirtyFields } = useFormState({ control, name: 'key' });
  const following = enabled && !dirtyFields.key;
  useEffect(() => {
    if (following) {
      setValue('key', keyFromLabel(label), { shouldValidate: getFieldState('key').isTouched });
    }
  }, [following, label, getFieldState, setValue]);
  return following;
}

/** Marks the key as made from the label while it still is; the hint under it says so in words. */
const AUTO_KEY_ADORNMENT = {
  input: {
    endAdornment: (
      <InputAdornment position="end">
        <AutoModeIcon fontSize="small" color="action" />
      </InputAdornment>
    ),
  },
};

/** Type, key and record types: chosen when the property is made, read-only after that. */
export function CrmPropertyIdentityFields({ isEdit }: Readonly<{ isEdit: boolean }>) {
  const t = useT();
  const { control } = useFormContext<CrmPropertyFormValues>();
  const type = useWatch({ control, name: 'type' });
  const autoKey = useKeyFromLabel(!isEdit);

  if (isEdit) {
    return (
      <>
        <RhfTextField name="key" label="Key" disabled helperText={KEY_HINT} />
        <TextField
          label={t('Type')}
          value={t(PROPERTY_TYPE_LABELS[type])}
          disabled
          fullWidth
          helperText={t('The type cannot change once the property is saved.')}
        />
        {CHOICE_TYPES.has(type) && <CrmPropertyOptionsFields />}
      </>
    );
  }

  return (
    <>
      <RhfTextField
        name="key"
        label="Key"
        helperText={autoKey ? AUTO_KEY_HINT : KEY_HINT}
        slotProps={autoKey ? AUTO_KEY_ADORNMENT : undefined}
      />
      <CrmPropertyObjectsFields />
      <CrmPropertyTypeSelect />
      {CHOICE_TYPES.has(type) && <CrmPropertyOptionsFields />}
    </>
  );
}

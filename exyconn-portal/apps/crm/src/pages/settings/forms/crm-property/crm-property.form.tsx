import { useEffect, useMemo } from 'react';
import { useForm, useFormContext, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { useT } from '@exyconn/i18n';
import { Alert, TextField } from '@exyconn/shell/components/ui';
import { RhfSelect, RhfSwitch, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  CrmPropertyType,
  useCreateCrmPropertyMutation,
  useUpdateCrmPropertyMutation,
  type CrmObject,
} from '@exyconn/shell/graphql/generated';
import { PROPERTY_TYPE_LABELS, propertyRefetches } from '../../property-types';
import { keyFromLabel } from './crm-property.key';
import { CrmPropertyOptionsFields } from './crm-property-options.fields';
import {
  crmPropertySchema,
  toPropertyFormValues,
  toPropertyInput,
  toPropertyUpdateInput,
  type CrmPropertyFormValues,
  type CrmPropertyRow,
} from './crm-property.types';

const KEY_HINT = 'Used in imports, exports and the API. It cannot change once saved.';

/** Keeps a new property's key in step with its label until somebody edits the key. */
function useKeyFromLabel(enabled: boolean) {
  const { control, getFieldState, setValue } = useFormContext<CrmPropertyFormValues>();
  const label = useWatch({ control, name: 'label' });
  useEffect(() => {
    if (enabled && !getFieldState('key').isDirty) {
      setValue('key', keyFromLabel(label));
    }
  }, [enabled, label, getFieldState, setValue]);
}

/** Type and key: chosen when the property is made, shown read-only after that. */
function IdentityFields({ isEdit }: Readonly<{ isEdit: boolean }>) {
  const t = useT();
  const { control } = useFormContext<CrmPropertyFormValues>();
  const type = useWatch({ control, name: 'type' });
  const typeOptions = Object.values(CrmPropertyType).map((value) => ({
    value,
    label: t(PROPERTY_TYPE_LABELS[value]),
  }));
  useKeyFromLabel(!isEdit);

  return (
    <>
      <RhfTextField name="key" label="Key" disabled={isEdit} helperText={KEY_HINT} />
      {isEdit ? (
        <TextField
          label={t('Type')}
          value={t(PROPERTY_TYPE_LABELS[type])}
          disabled
          fullWidth
          helperText={t('The type cannot change once the property is saved.')}
        />
      ) : (
        <RhfSelect name="type" label="Type" options={typeOptions} />
      )}
      {type === CrmPropertyType.Enum && <CrmPropertyOptionsFields />}
    </>
  );
}

/** The message the server sent back, shown above the fields until the next save. */
function ServerError() {
  const t = useT();
  const {
    formState: { errors },
  } = useFormContext<CrmPropertyFormValues>();
  const message = errors.root?.message;
  return message ? <Alert severity="error">{t(message)}</Alert> : null;
}

interface CrmPropertyFormProps {
  object: CrmObject;
  /** The property being edited, or null when creating. */
  initial: CrmPropertyRow | null;
  /** The record type's built-in keys, which a new property cannot take. */
  builtInKeys: ReadonlySet<string>;
  onDone: () => void;
  onCancel: () => void;
}

type Schema = ReturnType<typeof crmPropertySchema>;

/** React Hook Form + Zod form to create or change one custom property of a record type. */
export function CrmPropertyForm({
  object,
  initial,
  builtInKeys,
  onDone,
  onCancel,
}: Readonly<CrmPropertyFormProps>) {
  const notify = useNotify();
  const isEdit = initial !== null;
  const schema = useMemo(() => crmPropertySchema(builtInKeys), [builtInKeys]);
  const methods = useForm<z.input<Schema>, unknown, CrmPropertyFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: toPropertyFormValues(initial),
  });
  const refetchQueries = propertyRefetches(object);
  const [createProperty] = useCreateCrmPropertyMutation({ refetchQueries });
  const [updateProperty] = useUpdateCrmPropertyMutation({ refetchQueries });

  const save = (values: CrmPropertyFormValues) =>
    initial
      ? updateProperty({ variables: { id: initial.id, input: toPropertyUpdateInput(values) } })
      : createProperty({ variables: { input: toPropertyInput(object, values) } });

  const onSubmit = async (values: CrmPropertyFormValues) => {
    try {
      await save(values);
      notify(isEdit ? 'Property "{label}" updated' : 'Property "{label}" created', 'success', {
        label: values.label,
      });
      onDone();
    } catch (error) {
      portalLogger.warn('Could not save a CRM property', error, { object, isEdit });
      methods.setError('root', { message: errorMessage(error, 'Could not save the property') });
    }
  };

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <ServerError />
      <RhfTextField name="label" label="Label" helperText="What the field is called on records" />
      <IdentityFields isEdit={isEdit} />
      <RhfSwitch name="required" label="Required on every record" />
      <RhfTextField
        name="description"
        label="Help text"
        multiline
        rows={2}
        helperText="Optional. Shown under the field on the record form."
      />
    </EntityForm>
  );
}

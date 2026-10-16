import { useMemo } from 'react';
import { useForm, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { useT } from '@exyconn/i18n';
import { Alert } from '@exyconn/shell/components/ui';
import { RhfSwitch, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  useCreateCrmPropertiesMutation,
  useUpdateCrmPropertyMutation,
  type CrmObject,
} from '@exyconn/shell/graphql/generated';
import { propertyRefetches } from '../../property-types';
import { CrmPropertyIdentityFields } from './crm-property-identity.fields';
import {
  crmPropertySchema,
  toPropertyFormValues,
  toPropertyInput,
  toPropertyUpdateInput,
  type CrmPropertyFormValues,
  type CrmPropertyRow,
} from './crm-property.types';
import { useTakenKeys } from './useTakenKeys';

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
  /** The record type whose tab the form was opened from; a new property starts on it. */
  object: CrmObject;
  /** The property being edited, or null when creating. */
  initial: CrmPropertyRow | null;
  onDone: () => void;
  onCancel: () => void;
}

type Schema = ReturnType<typeof crmPropertySchema>;

/**
 * React Hook Form + Zod form to create a custom property on one or more record types, or to
 * change one record type's copy of it.
 */
export function CrmPropertyForm({
  object,
  initial,
  onDone,
  onCancel,
}: Readonly<CrmPropertyFormProps>) {
  const notify = useNotify();
  const isEdit = initial !== null;
  const taken = useTakenKeys();
  const schema = useMemo(() => crmPropertySchema(isEdit ? null : taken), [isEdit, taken]);
  const methods = useForm<z.input<Schema>, unknown, CrmPropertyFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: toPropertyFormValues(initial, object),
  });
  const [createProperties] = useCreateCrmPropertiesMutation();
  const [updateProperty] = useUpdateCrmPropertyMutation({
    refetchQueries: propertyRefetches(object),
  });

  // Every record type the new property went onto re-reads its columns and its settings tab.
  const save = (values: CrmPropertyFormValues) =>
    initial
      ? updateProperty({ variables: { id: initial.id, input: toPropertyUpdateInput(values) } })
      : createProperties({
          variables: { input: toPropertyInput(values) },
          refetchQueries: values.objects.flatMap(propertyRefetches),
        });

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
      <CrmPropertyIdentityFields isEdit={isEdit} />
      <RhfSwitch name="required" label="Required on every record" />
      <RhfTextField
        name="description"
        label="Help text"
        multiline
        rows={2}
        helperText="Optional. Shown under the field on the record form, e.g. 'Score from 0 to 100'."
      />
    </EntityForm>
  );
}

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import type { SelectOption } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  CrmObject,
  useCreateContactMutation,
  useUpdateContactMutation,
  useListCompaniesQuery,
} from '@exyconn/shell/graphql/generated';
import {
  CustomFieldsSection,
  CustomPropertiesGate,
  type CustomPropertyDef,
} from '../../../../records/custom-fields';
import { ContactDetailsFields } from './contact-details.fields';
import {
  buildContactSchema,
  toContactInput,
  toContactValues,
  type ContactSchema,
  type ContactValues,
} from './contact.schema';
import type { ContactRow } from './contact.types';

interface ContactFormProps {
  initial: ContactRow | null;
  onDone: () => void;
  onCancel: () => void;
  /** Told the new record's id and name after a create, e.g. to pick it in a dropdown. */
  onCreated?: (created: { id: string; name: string }) => void;
}

/**
 * React Hook Form + Zod form to create or update a person at an account: several emails and
 * phones (one primary), lifecycle, whereabouts and the company's custom properties.
 */
export function ContactForm(props: Readonly<ContactFormProps>) {
  return (
    <CustomPropertiesGate object={CrmObject.Contact}>
      {(properties) => <ContactFormFields {...props} properties={properties} />}
    </CustomPropertiesGate>
  );
}

function ContactFormFields({
  initial,
  onDone,
  onCancel,
  onCreated,
  properties,
}: Readonly<ContactFormProps & { properties: CustomPropertyDef[] }>) {
  const [createContact] = useCreateContactMutation();
  const [updateContact] = useUpdateContactMutation();
  const { data, refetch: refetchCompanies } = useListCompaniesQuery();
  const schema = useMemo(() => buildContactSchema(properties), [properties]);
  const methods = useForm<z.input<ContactSchema>, unknown, ContactValues>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: toContactValues(initial, properties),
  });

  const companies = data?.listCompanies ?? [];
  const companyOptions: SelectOption[] = companies.map((c) => ({ value: c.id, label: c.name }));
  const companyNameOf = (id: string) => companies.find((c) => c.id === id)?.name ?? '';
  const toInput = (values: ContactValues) => toContactInput(values, properties, companyNameOf);

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Contact',
    initial,
    create: async (values: ContactValues) => {
      const result = await createContact({ variables: { input: toInput(values) } });
      const created = result.data?.createContact;
      if (created) {
        onCreated?.({ id: created.id, name: created.name });
      }
      return result;
    },
    update: (row, values) => updateContact({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <ContactDetailsFields companyOptions={companyOptions} onRefreshCompanies={refetchCompanies} />
      <CustomFieldsSection properties={properties} />
    </EntityForm>
  );
}

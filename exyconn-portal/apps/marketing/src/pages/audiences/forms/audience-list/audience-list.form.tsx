import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  RhfTextField,
  RhfSelect,
  RhfMultiSelect,
  type SelectOption,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  AudienceSegment,
  useListClientsQuery,
  useListContactsQuery,
  useCreateAudienceListMutation,
  useUpdateAudienceListMutation,
} from '@exyconn/shell/graphql/generated';
import { COMPANY_STATUS_OPTIONS } from './audience-list.types';
import type { AudienceRow } from './audience-list.types';

const schema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    description: z.string().trim(),
    clientIds: z.array(z.string()),
    contactIds: z.array(z.string()),
    dynamicSegment: z.nativeEnum(AudienceSegment),
    segmentValue: z.string().trim(),
  })
  .refine(
    (values) =>
      values.dynamicSegment !== AudienceSegment.None ||
      values.clientIds.length > 0 ||
      values.contactIds.length > 0,
    { path: ['contactIds'], message: 'Pick some people, or choose a segment rule' },
  )
  .refine(
    (values) =>
      values.dynamicSegment !== AudienceSegment.ContactsByCompanyStatus ||
      values.segmentValue.length > 0,
    { path: ['segmentValue'], message: 'Choose the account status to segment on' },
  );
type Values = z.infer<typeof schema>;

const toInitial = (row: AudienceRow | null): Values => ({
  name: row?.name ?? '',
  description: row?.description ?? '',
  clientIds: row?.clientIds ?? [],
  contactIds: row?.contactIds ?? [],
  dynamicSegment: row?.dynamicSegment ?? AudienceSegment.None,
  segmentValue: row?.segmentValue ?? '',
});

interface AudienceListFormProps {
  initial: AudienceRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form for the people a campaign can be sent to. */
export function AudienceListForm({ initial, onDone, onCancel }: Readonly<AudienceListFormProps>) {
  const { data: clientsData } = useListClientsQuery();
  const { data: contactsData } = useListContactsQuery();
  const [createAudienceList] = useCreateAudienceListMutation();
  const [updateAudienceList] = useUpdateAudienceListMutation();
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });
  const segment = useWatch({ control: methods.control, name: 'dynamicSegment' });

  const clientOptions: SelectOption[] = (clientsData?.listClients ?? []).map((client) => ({
    value: client.id,
    label: `${client.name} · ${client.email}`,
  }));
  const contactOptions: SelectOption[] = (contactsData?.listContacts ?? []).map((contact) => ({
    value: contact.id,
    label: `${contact.name} · ${contact.email}`,
  }));

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Audience',
    initial,
    create: (values: Values) => createAudienceList({ variables: { input: values } }),
    update: (row, values) => updateAudienceList({ variables: { id: row.id, input: values } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="name" label="Audience name" helperText="e.g. Newsletter subscribers" />
      <RhfTextField name="description" label="Description" multiline rows={2} />
      <RhfMultiSelect
        name="clientIds"
        label="Clients"
        options={clientOptions}
        helperText={clientOptions.length ? undefined : 'No clients found — add clients first.'}
      />
      <RhfMultiSelect
        name="contactIds"
        label="CRM contacts"
        options={contactOptions}
        helperText={contactOptions.length ? undefined : 'No contacts found — add contacts first.'}
      />
      <RhfSelect
        name="dynamicSegment"
        label="Segment rule"
        options={enumOptions(Object.values(AudienceSegment))}
        helperText="Re-resolved on every send, so the list never goes stale."
      />
      {segment === AudienceSegment.ContactsByCompanyStatus && (
        <RhfSelect name="segmentValue" label="Account status" options={COMPANY_STATUS_OPTIONS} />
      )}
    </EntityForm>
  );
}

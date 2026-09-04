import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  RhfTextField,
  RhfMultiSelect,
  type SelectOption,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  useListClientsQuery,
  useCreateAudienceListMutation,
  useUpdateAudienceListMutation,
} from '@exyconn/shell/graphql/generated';
import type { AudienceRow } from './audience-list.types';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim(),
  clientIds: z.array(z.string()).min(1, 'An audience needs at least one client'),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: AudienceRow | null): Values => ({
  name: row?.name ?? '',
  description: row?.description ?? '',
  clientIds: row?.clientIds ?? [],
});

interface AudienceListFormProps {
  initial: AudienceRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to name a client list a campaign can be sent to. */
export function AudienceListForm({ initial, onDone, onCancel }: Readonly<AudienceListFormProps>) {
  const { data } = useListClientsQuery();
  const [createAudienceList] = useCreateAudienceListMutation();
  const [updateAudienceList] = useUpdateAudienceListMutation();
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const options: SelectOption[] = (data?.listClients ?? []).map((client) => ({
    value: client.id,
    label: `${client.name} · ${client.email}`,
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
        options={options}
        helperText={options.length ? undefined : 'No clients found — add clients first.'}
      />
    </EntityForm>
  );
}

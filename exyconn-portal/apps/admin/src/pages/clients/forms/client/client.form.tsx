import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField, RhfSelect } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  ClientStatus,
  useCreateClientMutation,
  useUpdateClientMutation,
} from '@exyconn/shell/graphql/generated';
import type { ClientRow } from './client.types';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
  phone: z.string().trim().min(1, 'Phone is required').min(7, 'Enter a valid phone'),
  company: z.string().trim().min(1, 'Company is required'),
  status: z.nativeEnum(ClientStatus),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: ClientRow | null): Values => ({
  name: row?.name ?? '',
  email: row?.email ?? '',
  phone: row?.phone ?? '',
  company: row?.company ?? '',
  status: row?.status ?? ClientStatus.Prospect,
});

interface ClientFormProps {
  initial: ClientRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a client. */
export function ClientForm({ initial, onDone, onCancel }: ClientFormProps) {
  const [createClient] = useCreateClientMutation();
  const [updateClient] = useUpdateClientMutation();
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Client',
    initial,
    create: (values: Values) => createClient({ variables: { input: values } }),
    update: (row, values) => updateClient({ variables: { id: row.id, input: values } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="name" label="Name" />
      <RhfTextField name="email" label="Email" type="email" />
      <RhfTextField name="phone" label="Phone" />
      <RhfTextField name="company" label="Company" />
      <RhfSelect name="status" label="Status" options={enumOptions(Object.values(ClientStatus))} />
    </EntityForm>
  );
}

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Flex } from '@exyconn/shell/components/ui';
import { RhfTextField, RhfSelect } from '@exyconn/shell/components/form/rhf';
import { FormActions } from '@exyconn/shell/components/form/FormActions';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
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
  const notify = useNotify();
  const [createClient] = useCreateClientMutation();
  const [updateClient] = useUpdateClientMutation();
  const isEdit = Boolean(initial);
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const onSubmit = async (values: Values) => {
    try {
      if (isEdit && initial) await updateClient({ variables: { id: initial.id, input: values } });
      else await createClient({ variables: { input: values } });
      notify(`Client ${isEdit ? 'updated' : 'created'}`);
      onDone();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Save failed', 'error');
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Flex direction="column" spacing={2.5}>
          <RhfTextField name="name" label="Name" />
          <RhfTextField name="email" label="Email" type="email" />
          <RhfTextField name="phone" label="Phone" />
          <RhfTextField name="company" label="Company" />
          <RhfSelect
            name="status"
            label="Status"
            options={enumOptions(Object.values(ClientStatus))}
          />
          <FormActions
            submitting={methods.formState.isSubmitting}
            isEdit={isEdit}
            onCancel={onCancel}
          />
        </Flex>
      </form>
    </FormProvider>
  );
}

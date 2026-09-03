import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField, RhfSelect, type SelectOption } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  ContactStatus,
  useCreateContactMutation,
  useUpdateContactMutation,
  useListCompaniesQuery,
} from '@exyconn/shell/graphql/generated';
import type { ContactRow } from './contact.types';

const STATUS_OPTIONS = enumOptions(Object.values(ContactStatus));

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
  phone: z.string().trim(),
  title: z.string().trim(),
  companyId: z.string().trim(),
  status: z.nativeEnum(ContactStatus),
  owner: z.string().trim().min(1, 'Owner is required'),
  notes: z.string().trim(),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: ContactRow | null): Values => ({
  name: row?.name ?? '',
  email: row?.email ?? '',
  phone: row?.phone ?? '',
  title: row?.title ?? '',
  companyId: row?.companyId ?? '',
  status: row?.status ?? ContactStatus.Active,
  owner: row?.owner ?? '',
  notes: row?.notes ?? '',
});

interface ContactFormProps {
  initial: ContactRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a person at an account. */
export function ContactForm({ initial, onDone, onCancel }: Readonly<ContactFormProps>) {
  const [createContact] = useCreateContactMutation();
  const [updateContact] = useUpdateContactMutation();
  const { data } = useListCompaniesQuery();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const companies = data?.listCompanies ?? [];
  const companyOptions: SelectOption[] = companies.map((c) => ({ value: c.id, label: c.name }));
  // The company name is stored alongside the id so a contact row reads without a join.
  const toInput = (values: Values) => ({
    ...values,
    companyName: companies.find((c) => c.id === values.companyId)?.name ?? '',
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Contact',
    initial,
    create: (values: Values) => createContact({ variables: { input: toInput(values) } }),
    update: (row, values) => updateContact({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="name" label="Full name" />
      <RhfTextField name="title" label="Job title" />
      <RhfSelect name="companyId" label="Company" options={companyOptions} />
      <RhfTextField name="email" label="Email" type="email" />
      <RhfTextField name="phone" label="Phone" />
      <RhfSelect name="status" label="Status" options={STATUS_OPTIONS} />
      <RhfTextField name="owner" label="Owner" />
      <RhfTextField name="notes" label="Notes" multiline rows={2} />
    </EntityForm>
  );
}

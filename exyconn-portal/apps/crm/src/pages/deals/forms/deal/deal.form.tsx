import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  RhfTextField,
  RhfSelect,
  RhfDatePicker,
  type SelectOption,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  DealStage,
  useCreateDealMutation,
  useUpdateDealMutation,
  useListCompaniesQuery,
  useListContactsQuery,
} from '@exyconn/shell/graphql/generated';
import type { DealRow } from './deal.types';

const STAGE_OPTIONS = enumOptions(Object.values(DealStage));

const schema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  companyId: z.string().trim(),
  contactId: z.string().trim(),
  stage: z.nativeEnum(DealStage),
  value: z.coerce.number({ message: 'Value must be a number' }).min(0, 'Value cannot be negative'),
  probability: z.coerce
    .number({ message: 'Probability must be a number' })
    .min(0, 'Probability is a percent, 0-100')
    .max(100, 'Probability is a percent, 0-100'),
  expectedCloseDate: z.date().nullable(),
  owner: z.string().trim().min(1, 'Owner is required'),
  notes: z.string().trim(),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: DealRow | null): Values => ({
  title: row?.title ?? '',
  companyId: row?.companyId ?? '',
  contactId: row?.contactId ?? '',
  stage: row?.stage ?? DealStage.Qualifying,
  value: row?.value ?? 0,
  probability: row?.probability ?? 10,
  expectedCloseDate: row?.expectedCloseDate ? new Date(row.expectedCloseDate) : null,
  owner: row?.owner ?? '',
  notes: row?.notes ?? '',
});

interface DealFormProps {
  initial: DealRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update an opportunity. */
export function DealForm({ initial, onDone, onCancel }: Readonly<DealFormProps>) {
  const [createDeal] = useCreateDealMutation();
  const [updateDeal] = useUpdateDealMutation();
  const { data: companiesData } = useListCompaniesQuery();
  const { data: contactsData } = useListContactsQuery();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const companies = companiesData?.listCompanies ?? [];
  const contacts = contactsData?.listContacts ?? [];
  const companyOptions: SelectOption[] = companies.map((c) => ({ value: c.id, label: c.name }));
  const contactOptions: SelectOption[] = contacts.map((c) => ({
    value: c.id,
    label: c.companyName ? `${c.name} — ${c.companyName}` : c.name,
  }));

  // Names travel with the ids so a board card renders without joining.
  const toInput = (values: Values) => ({
    ...values,
    expectedCloseDate: values.expectedCloseDate?.toISOString() ?? null,
    companyName: companies.find((c) => c.id === values.companyId)?.name ?? '',
    contactName: contacts.find((c) => c.id === values.contactId)?.name ?? '',
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Deal',
    initial,
    create: (values: Values) => createDeal({ variables: { input: toInput(values) } }),
    update: (row, values) => updateDeal({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="title" label="Deal" />
      <RhfSelect name="companyId" label="Company" options={companyOptions} />
      <RhfSelect name="contactId" label="Contact" options={contactOptions} />
      <RhfSelect name="stage" label="Stage" options={STAGE_OPTIONS} />
      <RhfTextField name="value" label="Value" type="number" />
      <RhfTextField
        name="probability"
        label="Probability"
        type="number"
        helperText="Percent, 0-100"
      />
      <RhfDatePicker name="expectedCloseDate" label="Expected close" />
      <RhfTextField name="owner" label="Owner" />
      <RhfTextField name="notes" label="Notes" multiline rows={2} />
    </EntityForm>
  );
}

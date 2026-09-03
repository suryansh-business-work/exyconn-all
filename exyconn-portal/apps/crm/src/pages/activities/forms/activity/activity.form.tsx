import { useForm, useWatch } from 'react-hook-form';
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
  ActivitySubject,
  ActivityType,
  useCreateActivityMutation,
  useUpdateActivityMutation,
  useListCompaniesQuery,
  useListContactsQuery,
  useListDealsQuery,
} from '@exyconn/shell/graphql/generated';
import type { ActivityRow } from './activity.types';

const TYPE_OPTIONS = enumOptions(Object.values(ActivityType));
const SUBJECT_OPTIONS = enumOptions(Object.values(ActivitySubject));
const DONE_OPTIONS: SelectOption[] = [
  { value: 'false', label: 'Outstanding' },
  { value: 'true', label: 'Done' },
];

const schema = z.object({
  type: z.nativeEnum(ActivityType),
  subject: z.string().trim().min(1, 'Subject is required'),
  notes: z.string().trim(),
  relatedType: z.nativeEnum(ActivitySubject),
  relatedId: z.string().trim().min(1, 'Choose what this is about'),
  dueDate: z.date().nullable(),
  done: z.enum(['true', 'false']),
  owner: z.string().trim().min(1, 'Owner is required'),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: ActivityRow | null): Values => ({
  type: row?.type ?? ActivityType.Note,
  subject: row?.subject ?? '',
  notes: row?.notes ?? '',
  relatedType: row?.relatedType ?? ActivitySubject.Deal,
  relatedId: row?.relatedId ?? '',
  dueDate: row?.dueDate ? new Date(row.dueDate) : null,
  done: row?.done ? 'true' : 'false',
  owner: row?.owner ?? '',
});

interface ActivityFormProps {
  initial: ActivityRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to log an interaction or schedule a follow-up. */
export function ActivityForm({ initial, onDone, onCancel }: Readonly<ActivityFormProps>) {
  const [createActivity] = useCreateActivityMutation();
  const [updateActivity] = useUpdateActivityMutation();
  const { data: dealsData } = useListDealsQuery();
  const { data: contactsData } = useListContactsQuery();
  const { data: companiesData } = useListCompaniesQuery();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const relatedType = useWatch({ control: methods.control, name: 'relatedType' });
  // The picker follows what the activity is about, so a deal note cannot end up
  // pointing at a company id.
  const relatedOptions: Record<ActivitySubject, SelectOption[]> = {
    [ActivitySubject.Deal]: (dealsData?.listDeals ?? []).map((d) => ({
      value: d.id,
      label: d.title,
    })),
    [ActivitySubject.Contact]: (contactsData?.listContacts ?? []).map((c) => ({
      value: c.id,
      label: c.name,
    })),
    [ActivitySubject.Company]: (companiesData?.listCompanies ?? []).map((c) => ({
      value: c.id,
      label: c.name,
    })),
  };
  const options = relatedOptions[(relatedType as ActivitySubject) ?? ActivitySubject.Deal];

  const toInput = (values: Values) => ({
    ...values,
    done: values.done === 'true',
    dueDate: values.dueDate?.toISOString() ?? null,
    relatedName: options.find((o) => o.value === values.relatedId)?.label ?? '',
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Activity',
    initial,
    create: (values: Values) => createActivity({ variables: { input: toInput(values) } }),
    update: (row, values) => updateActivity({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="subject" label="Subject" />
      <RhfSelect name="type" label="Type" options={TYPE_OPTIONS} />
      <RhfSelect name="relatedType" label="About" options={SUBJECT_OPTIONS} />
      <RhfSelect name="relatedId" label="Related to" options={options} />
      <RhfDatePicker name="dueDate" label="Due" />
      <RhfSelect name="done" label="Status" options={DONE_OPTIONS} />
      <RhfTextField name="owner" label="Owner" />
      <RhfTextField name="notes" label="Notes" multiline rows={3} />
    </EntityForm>
  );
}

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  RhfDatePicker,
  RhfMultiSelect,
  RhfSelect,
  RhfSwitch,
  RhfTextField,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  AnnouncementCategory,
  AnnouncementAudience,
  useListUsersQuery,
  useCreateAnnouncementMutation,
  useUpdateAnnouncementMutation,
} from '@exyconn/shell/graphql/generated';
import type { AnnouncementRow, AnnouncementFormValues } from './announcement.types';

const schema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(120, 'Keep it under 120 characters'),
    body: z.string().trim().min(1, 'Message is required'),
    category: z.nativeEnum(AnnouncementCategory),
    pinned: z.boolean(),
    publishedAt: z.string().min(1, 'Publish date is required'),
    expiresAt: z.string(),
    audience: z.nativeEnum(AnnouncementAudience),
    department: z.string().trim(),
    employeeIds: z.array(z.string()),
  })
  .refine((v) => !v.expiresAt || new Date(v.expiresAt) > new Date(v.publishedAt), {
    message: 'Expiry must be after the publish date',
    path: ['expiresAt'],
  })
  .refine((v) => v.audience !== AnnouncementAudience.Department || v.department.length > 0, {
    message: 'Pick a department',
    path: ['department'],
  })
  .refine((v) => v.audience !== AnnouncementAudience.Employees || v.employeeIds.length > 0, {
    message: 'Pick at least one employee',
    path: ['employeeIds'],
  });
type Values = z.infer<typeof schema>;

const toInitial = (row: AnnouncementRow | null): AnnouncementFormValues => ({
  title: row?.title ?? '',
  body: row?.body ?? '',
  category: row?.category ?? AnnouncementCategory.Notice,
  pinned: row?.pinned ?? false,
  publishedAt: row?.publishedAt ?? new Date().toISOString(),
  expiresAt: row?.expiresAt ?? '',
  audience: row?.audience ?? AnnouncementAudience.All,
  department: row?.department ?? '',
  employeeIds: row?.employeeIds ?? [],
});

/** Empty expiry means "never"; audience details not relevant to the chosen audience are dropped. */
const toInput = (values: Values) => ({
  ...values,
  expiresAt: values.expiresAt || null,
  department: values.audience === AnnouncementAudience.Department ? values.department : null,
  employeeIds: values.audience === AnnouncementAudience.Employees ? values.employeeIds : null,
});

interface AnnouncementFormProps {
  initial: AnnouncementRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to publish or edit a company announcement. */
export function AnnouncementForm({ initial, onDone, onCancel }: Readonly<AnnouncementFormProps>) {
  const [createAnnouncement] = useCreateAnnouncementMutation();
  const [updateAnnouncement] = useUpdateAnnouncementMutation();
  const { data: usersData } = useListUsersQuery();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const audience = methods.watch('audience');
  const users = usersData?.listUsers ?? [];
  const employeeOptions = users.map((u) => ({ value: u.id, label: `${u.name} (${u.email})` }));
  const departmentOptions = [
    ...new Set(users.map((u) => u.department).filter((d): d is string => Boolean(d))),
  ]
    .sort((a, b) => a.localeCompare(b))
    .map((d) => ({ value: d, label: d }));

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Announcement',
    initial,
    create: (values: Values) => createAnnouncement({ variables: { input: toInput(values) } }),
    update: (row, values) =>
      updateAnnouncement({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="title" label="Title" />
      <RhfTextField name="body" label="Message" multiline minRows={4} />
      <RhfSelect
        name="category"
        label="Category"
        options={enumOptions(Object.values(AnnouncementCategory))}
      />
      <RhfDatePicker name="publishedAt" label="Publish on" />
      <RhfDatePicker name="expiresAt" label="Expires on (optional)" />
      <RhfSelect
        name="audience"
        label="Audience"
        options={enumOptions(Object.values(AnnouncementAudience))}
      />
      {audience === AnnouncementAudience.Department && (
        <RhfSelect name="department" label="Department" options={departmentOptions} />
      )}
      {audience === AnnouncementAudience.Employees && (
        <RhfMultiSelect name="employeeIds" label="Employees" options={employeeOptions} />
      )}
      <RhfSwitch name="pinned" label="Pin to the top" />
    </EntityForm>
  );
}

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  RhfTextField,
  RhfSelect,
  RhfDatePicker,
  RhfSwitch,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  AnnouncementCategory,
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
  })
  .refine((v) => !v.expiresAt || new Date(v.expiresAt) > new Date(v.publishedAt), {
    message: 'Expiry must be after the publish date',
    path: ['expiresAt'],
  });
type Values = z.infer<typeof schema>;

const toInitial = (row: AnnouncementRow | null): AnnouncementFormValues => ({
  title: row?.title ?? '',
  body: row?.body ?? '',
  category: row?.category ?? AnnouncementCategory.Notice,
  pinned: row?.pinned ?? false,
  publishedAt: row?.publishedAt ?? new Date().toISOString(),
  expiresAt: row?.expiresAt ?? '',
});

/** An empty expiry means "never", which the API models as null. */
const toInput = (values: Values) => ({ ...values, expiresAt: values.expiresAt || null });

interface AnnouncementFormProps {
  initial: AnnouncementRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to publish or edit a company announcement. */
export function AnnouncementForm({ initial, onDone, onCancel }: Readonly<AnnouncementFormProps>) {
  const [createAnnouncement] = useCreateAnnouncementMutation();
  const [updateAnnouncement] = useUpdateAnnouncementMutation();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

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
      <RhfSwitch name="pinned" label="Pin to the top" />
    </EntityForm>
  );
}

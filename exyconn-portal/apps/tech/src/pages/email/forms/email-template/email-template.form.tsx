import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert } from '@exyconn/shell/components/ui';
import { RhfTextField, RhfSwitch } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  useCreateEmailTemplateMutation,
  useUpdateEmailTemplateMutation,
} from '@exyconn/shell/graphql/generated';
import type { EmailTemplateRow } from './email-template.types';

/** Code sends by this key, so it has to be typeable and stable. */
const KEY_PATTERN = /^[a-z0-9-]+$/;

const schema = z.object({
  key: z
    .string()
    .trim()
    .min(1, 'Key is required')
    .regex(KEY_PATTERN, 'Lower-case letters, numbers and hyphens only'),
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim(),
  subject: z.string().trim().min(1, 'Subject is required'),
  mjml: z.string().trim().min(1, 'The template cannot be empty'),
  isActive: z.boolean(),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: EmailTemplateRow | null): Values => ({
  key: row?.key ?? '',
  name: row?.name ?? '',
  description: row?.description ?? '',
  subject: row?.subject ?? '',
  mjml: row?.mjml ?? '',
  isActive: row?.isActive ?? true,
});

interface Props {
  initial: EmailTemplateRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form for a transactional email template. */
export function EmailTemplateForm({ initial, onDone, onCancel }: Readonly<Props>) {
  const [createTemplate] = useCreateEmailTemplateMutation();
  const [updateTemplate] = useUpdateEmailTemplateMutation();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Template',
    initial,
    create: (values: Values) => createTemplate({ variables: { input: values } }),
    update: (row, values) => updateTemplate({ variables: { id: row.id, input: values } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      {isEdit ? (
        <Alert severity="warning" variant="outlined" sx={{ borderRadius: '4px' }}>
          Code sends this template by its key. Renaming the key stops whatever sends it.
        </Alert>
      ) : null}
      <RhfTextField name="key" label="Key" />
      <RhfTextField name="name" label="Name" />
      <RhfTextField name="description" label="Description" />
      <RhfTextField
        name="subject"
        label="Subject"
        helperText="Takes the same {{placeholders}} as the body."
      />
      <RhfTextField name="mjml" label="MJML" multiline rows={16} />
      <RhfSwitch name="isActive" label="Active (an inactive template refuses to send)" />
    </EntityForm>
  );
}

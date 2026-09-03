import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  useCreateEmailFragmentMutation,
  useUpdateEmailFragmentMutation,
} from '@exyconn/shell/graphql/generated';
import type { EmailFragmentRow } from './email-fragment.types';

/** Templates address a fragment as `{{> key }}`, so the key has to survive being typed. */
const KEY_PATTERN = /^[a-z0-9-]+$/;

const schema = z.object({
  key: z
    .string()
    .trim()
    .min(1, 'Key is required')
    .regex(KEY_PATTERN, 'Lower-case letters, numbers and hyphens only'),
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim(),
  mjml: z.string().trim().min(1, 'The fragment cannot be empty'),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: EmailFragmentRow | null): Values => ({
  key: row?.key ?? '',
  name: row?.name ?? '',
  description: row?.description ?? '',
  mjml: row?.mjml ?? '',
});

interface Props {
  initial: EmailFragmentRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form for a reusable MJML fragment. */
export function EmailFragmentForm({ initial, onDone, onCancel }: Readonly<Props>) {
  const [createFragment] = useCreateEmailFragmentMutation();
  const [updateFragment] = useUpdateEmailFragmentMutation();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Fragment',
    initial,
    create: (values: Values) => createFragment({ variables: { input: values } }),
    update: (row, values) => updateFragment({ variables: { id: row.id, input: values } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField
        name="key"
        label="Key"
        helperText="Templates include this as {{> key }}. Renaming it breaks those templates."
      />
      <RhfTextField name="name" label="Name" />
      <RhfTextField name="description" label="Description" />
      <RhfTextField name="mjml" label="MJML" multiline rows={14} />
    </EntityForm>
  );
}

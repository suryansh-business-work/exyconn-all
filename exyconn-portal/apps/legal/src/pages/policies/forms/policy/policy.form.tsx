import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  RhfTextField,
  RhfSelect,
  RhfSwitch,
  RhfDatePicker,
  RhfRichText,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  PolicyAudience,
  useCreatePolicyMutation,
  useUpdatePolicyMutation,
} from '@exyconn/shell/graphql/generated';
import type { PolicyRow } from './policy.types';

/** The slug is a public URL segment for PUBLIC policies, so it has to be URL-safe. */
const SLUG_PATTERN = /^[a-z0-9-]+$/;

const schema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  slug: z
    .string()
    .trim()
    .min(1, 'Slug is required')
    .regex(SLUG_PATTERN, 'Lower-case letters, numbers and hyphens only'),
  summary: z.string().trim(),
  body: z.string().trim().min(1, 'The policy cannot be empty'),
  audience: z.nativeEnum(PolicyAudience),
  effectiveDate: z.string().min(1, 'Effective date is required'),
  requiresAcknowledgement: z.boolean(),
  owner: z.string().trim(),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: PolicyRow | null): Values => ({
  title: row?.title ?? '',
  slug: row?.slug ?? '',
  summary: row?.summary ?? '',
  body: row?.body ?? '',
  audience: row?.audience ?? PolicyAudience.AllStaff,
  effectiveDate: row?.effectiveDate ?? '',
  requiresAcknowledgement: row?.requiresAcknowledgement ?? false,
  owner: row?.owner ?? '',
});

interface Props {
  initial: PolicyRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * React Hook Form + Zod form for a company policy.
 *
 * Editing here never publishes: a policy people are being asked to sign should not change
 * under them because somebody saved a draft, so putting it in force is a separate,
 * deliberate action with its own question about whether the version should go up.
 */
export function PolicyForm({ initial, onDone, onCancel }: Readonly<Props>) {
  const [createPolicy] = useCreatePolicyMutation();
  const [updatePolicy] = useUpdatePolicyMutation();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Policy',
    initial,
    create: (values: Values) => createPolicy({ variables: { input: values } }),
    update: (row, values) => updatePolicy({ variables: { id: row.id, input: values } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="title" label="Title" />
      <RhfTextField
        name="slug"
        label="Slug"
        helperText="A public policy is served to the website at this segment."
      />
      <RhfSelect
        name="audience"
        label="Audience"
        options={enumOptions(Object.values(PolicyAudience))}
      />
      <RhfTextField name="summary" label="Summary" multiline rows={2} />
      <RhfRichText name="body" label="Policy" />
      <RhfDatePicker name="effectiveDate" label="Effective from" />
      <RhfTextField name="owner" label="Owner" />
      <RhfSwitch name="requiresAcknowledgement" label="Staff must read and sign this" />
    </EntityForm>
  );
}

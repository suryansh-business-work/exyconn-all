import { useForm } from 'react-hook-form';
import { zodResolver } from '@/components/form/zodResolver';
import { z } from 'zod';
import { SLUG } from '@exyconn/regex';
import {
  RhfTextField,
  RhfSelect,
  RhfSwitch,
  RhfDatePicker,
  RhfRichText,
} from '@/components/form/rhf';
import { EntityForm } from '@/components/form/EntityForm';
import { useEntitySave } from '@/components/form/useEntitySave';
import { enumOptions } from '@/utils/enumOptions';
import { LegalGroupField } from '@/components/legal';
import {
  PolicyAudience,
  PolicyCategory,
  PolicyClassification,
  LegalItemKind,
  useCreatePolicyMutation,
  useUpdatePolicyMutation,
} from '@/graphql/generated';
import type { PolicyRow } from './policy.types';

const schema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Keep the title under 200 characters'),
  /** A public URL segment for PUBLIC policies, so it has to be URL-safe. */
  slug: z
    .string()
    .trim()
    .min(1, 'Slug is required')
    .regex(SLUG, 'Lower-case letters, numbers and hyphens only'),
  summary: z.string().trim().max(500, 'Keep the summary under 500 characters'),
  body: z.string().trim().min(1, 'The policy cannot be empty'),
  audience: z.enum(PolicyAudience),
  category: z.enum(PolicyCategory),
  effectiveDate: z.string().min(1, 'Effective date is required'),
  requiresAcknowledgement: z.boolean(),
  owner: z.string().trim(),
  classification: z.enum(PolicyClassification),
  /** Empty means nobody has promised to look at it again — allowed, and worth seeing. */
  nextReviewOn: z.string(),
  // '' leaves it ungrouped.
  groupId: z.string(),
});
type Values = z.infer<typeof schema>;

const ALL_CATEGORIES = Object.values(PolicyCategory);

/** A new policy starts as GENERAL, or as the first kind this screen maintains. */
const defaultCategory = (categories: readonly PolicyCategory[]): PolicyCategory =>
  categories.includes(PolicyCategory.General) ? PolicyCategory.General : categories[0];

const toInitial = (row: PolicyRow | null, fallback: PolicyCategory): Values => ({
  title: row?.title ?? '',
  slug: row?.slug ?? '',
  summary: row?.summary ?? '',
  body: row?.body ?? '',
  audience: row?.audience ?? PolicyAudience.AllStaff,
  category: row?.category ?? fallback,
  effectiveDate: row?.effectiveDate ?? '',
  requiresAcknowledgement: row?.requiresAcknowledgement ?? false,
  owner: row?.owner ?? '',
  classification: row?.classification ?? PolicyClassification.Internal,
  nextReviewOn: row?.nextReviewOn ?? '',
  groupId: row?.groupId ?? '',
});

interface Props {
  initial: PolicyRow | null;
  onDone: () => void;
  onCancel: () => void;
  /** The kinds this screen maintains. IT passes IT and SECURITY; Legal offers them all. */
  categories?: readonly PolicyCategory[];
  /** Offers Legal's policy groups. Legal sets it; IT, which cannot read them, does not. */
  grouping?: boolean;
}

/**
 * React Hook Form + Zod form for a company policy.
 *
 * Editing here never publishes: a policy people are being asked to sign should not change
 * under them because somebody saved a draft, so putting it in force is a separate,
 * deliberate action with its own question about whether the version should go up.
 */
export function PolicyForm({
  initial,
  onDone,
  onCancel,
  categories = ALL_CATEGORIES,
  grouping = false,
}: Readonly<Props>) {
  const [createPolicy] = useCreatePolicyMutation();
  const [updatePolicy] = useUpdatePolicyMutation();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial, defaultCategory(categories)),
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
      <RhfTextField
        name="title"
        label="Title"
        required
        placeholder="e.g. Acceptable Use Policy"
        helperText="The name staff see in their policy list."
      />
      <RhfTextField
        name="slug"
        label="Slug"
        required
        placeholder="acceptable-use"
        helperText="Lower-case letters, numbers and hyphens. A public policy is served to the website at this segment."
      />
      <RhfSelect
        name="audience"
        label="Audience"
        required
        options={enumOptions(Object.values(PolicyAudience))}
        helperText="Who can open it: all staff, a department, or the public website."
      />
      <RhfSelect
        name="category"
        label="Category"
        required
        options={enumOptions([...categories])}
        helperText="Which team maintains it. IT keeps the IT and security policies."
      />
      <RhfTextField
        name="summary"
        label="Summary"
        multiline
        rows={2}
        helperText="Optional. One or two sentences shown above the policy and in lists."
      />
      <RhfRichText
        name="body"
        label="Policy"
        required
        helperText="The full wording. Headings and lists carry through to downloads."
      />
      <RhfDatePicker
        name="effectiveDate"
        label="Effective from"
        required
        helperText="The day the policy takes effect."
      />
      <RhfTextField
        name="owner"
        label="Owner"
        placeholder="e.g. Head of People"
        helperText="Optional. Who answers questions about it and keeps it current."
      />
      <RhfSelect
        name="classification"
        label="Classification"
        required
        options={enumOptions(Object.values(PolicyClassification))}
        helperText="How far this document may travel. Who may open it comes from the audience."
      />
      {/* When somebody has to read this again and confirm it is still right. */}
      <RhfDatePicker
        name="nextReviewOn"
        label="Next review"
        helperText="Optional. When it must be read again and confirmed still right."
      />
      {grouping && <LegalGroupField kind={LegalItemKind.Policy} />}
      <RhfSwitch name="requiresAcknowledgement" label="Staff must read and sign this" />
    </EntityForm>
  );
}

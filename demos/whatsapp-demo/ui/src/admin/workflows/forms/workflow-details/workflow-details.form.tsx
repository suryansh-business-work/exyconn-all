import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SLUG } from '@exyconn/regex';
import { LIMITS } from '@exyconn/wa-flow';
import { RhfChipsInput, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { CountedField } from '../../editor/inspector/fields/CountedField';
import type { WorkflowDetailsFormProps, WorkflowDetailsValues } from './workflow-details.types';

/** Schema limits for keys and keywords (schema.ts `workflowSchema`). */
const MAX = { key: 64, keyword: 40, keywords: 20 } as const;

/** `workflowSchema`'s rules for these fields, with messages a person can act on. */
const schema = z.object({
  key: z
    .string()
    .trim()
    .min(1, 'Key is required')
    .max(MAX.key, 'Keep the key under 64 characters')
    .regex(SLUG, 'Use lowercase letters, digits and hyphens only'),
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(LIMITS.rowTitle, 'WhatsApp shows at most 24 characters'),
  description: z.string().trim().max(LIMITS.rowDescription, 'WhatsApp shows at most 72 characters'),
  keywords: z
    .array(z.string().trim().min(1).max(MAX.keyword, 'Keep each keyword under 40 characters'))
    .max(MAX.keywords, 'Use at most 20 keywords'),
  order: z.coerce.number<number>().int('Use a whole number').min(0, 'Use 0 or more'),
});

/** Key, name, description, keywords and menu position of a workflow (React Hook Form + Zod). */
export function WorkflowDetailsForm({
  initial,
  isEdit,
  onSubmit,
  onCancel,
}: Readonly<WorkflowDetailsFormProps>) {
  const methods = useForm<z.input<typeof schema>, unknown, WorkflowDetailsValues>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: initial,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField
        name="key"
        label="Key"
        disabled={isEdit}
        helperText={
          isEdit ? 'Fixed once created: Jump nodes and analytics use it' : 'e.g. book-appointment'
        }
      />
      <CountedField name="name" label="Name" max={LIMITS.rowTitle} hint="The menu row's title" />
      <CountedField
        name="description"
        label="Description"
        max={LIMITS.rowDescription}
        hint="The menu row's second line"
      />
      <RhfChipsInput
        name="keywords"
        label="Keywords"
        helperText="Typed words that start this workflow; press Enter after each"
      />
      <RhfTextField name="order" label="Menu position" type="number" helperText="0 comes first" />
    </EntityForm>
  );
}

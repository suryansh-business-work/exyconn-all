import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import type { WorkflowDetails, WorkflowFormValues } from './workflow.types';

/** The server refuses anything longer; the form says so first. */
const MAX_NAME = 120;
const MAX_DESCRIPTION = 1000;

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Give the workflow a name')
    .max(MAX_NAME, `Keep the name under ${MAX_NAME} characters`),
  description: z
    .string()
    .trim()
    .max(MAX_DESCRIPTION, `Keep the description under ${MAX_DESCRIPTION} characters`),
});

interface WorkflowFormProps {
  /** The workflow being renamed, or null for a new one. */
  initial: WorkflowFormValues | null;
  onSubmit: (details: WorkflowDetails) => Promise<void>;
  onCancel: () => void;
}

/** React Hook Form + Zod form for a workflow's name and what it is for. */
export function WorkflowForm({ initial, onSubmit, onCancel }: Readonly<WorkflowFormProps>) {
  const methods = useForm<z.input<typeof schema>, unknown, WorkflowFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: initial ?? { name: '', description: '' },
  });

  return (
    <EntityForm
      methods={methods}
      onSubmit={(values: WorkflowFormValues) => onSubmit(values)}
      isEdit={initial !== null}
      onCancel={onCancel}
      submitLabel={initial ? 'Save details' : 'Create workflow'}
    >
      <RhfTextField name="name" label="Name" helperText="e.g. Bug triage, Release sign-off" />
      <RhfTextField
        name="description"
        label="Description"
        helperText="Optional — what this workflow is for"
        multiline
        minRows={2}
      />
    </EntityForm>
  );
}

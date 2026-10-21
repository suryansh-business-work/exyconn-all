import { useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { z } from 'zod';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import type { WorkflowLabelValues } from './workflow-label.types';

/** The server's limit on any label in a workflow. */
const MAX_LABEL = 80;

const stepSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, 'Every step needs a name')
    .max(MAX_LABEL, `Keep it under ${MAX_LABEL} characters`),
});

const connectionSchema = z.object({
  label: z.string().trim().max(MAX_LABEL, `Keep it under ${MAX_LABEL} characters`),
});

interface WorkflowLabelFormProps {
  /** A step must be named; a connection's label is optional (a decision's "Yes" / "No"). */
  target: 'step' | 'connection';
  initial: string;
  onSubmit: (label: string) => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form that renames the selected step or labels a connection. */
export function WorkflowLabelForm({
  target,
  initial,
  onSubmit,
  onCancel,
}: Readonly<WorkflowLabelFormProps>) {
  const methods = useForm<WorkflowLabelValues>({
    mode: 'onTouched',
    resolver: zodResolver(target === 'step' ? stepSchema : connectionSchema),
    defaultValues: { label: initial },
  });

  return (
    <EntityForm
      methods={methods}
      onSubmit={(values: WorkflowLabelValues) => onSubmit(values.label.trim())}
      isEdit
      onCancel={onCancel}
      submitLabel="Apply"
    >
      <RhfTextField
        name="label"
        label={target === 'step' ? 'Step name' : 'Connection label'}
        helperText={target === 'step' ? 'What happens at this step' : 'e.g. Yes, No, Approved'}
      />
    </EntityForm>
  );
}

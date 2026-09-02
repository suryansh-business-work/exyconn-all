import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField, RhfSelect } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  AiJobStatus,
  useCreateAiJobMutation,
  useUpdateAiJobMutation,
} from '@exyconn/shell/graphql/generated';
import type { AiJobRow } from './ai-job.types';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  model: z.string().trim().min(1, 'Model is required'),
  prompt: z.string().trim().min(1, 'Prompt is required').min(3, 'Add a prompt'),
  status: z.nativeEnum(AiJobStatus),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: AiJobRow | null): Values => ({
  name: row?.name ?? '',
  model: row?.model ?? '',
  prompt: row?.prompt ?? '',
  status: row?.status ?? AiJobStatus.Queued,
});

interface AiJobFormProps {
  initial: AiJobRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update an AI job. */
export function AiJobForm({ initial, onDone, onCancel }: AiJobFormProps) {
  const [createAiJob] = useCreateAiJobMutation();
  const [updateAiJob] = useUpdateAiJobMutation();
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'AI job',
    initial,
    create: (values: Values) => createAiJob({ variables: { input: values } }),
    update: (row, values) => updateAiJob({ variables: { id: row.id, input: values } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="name" label="Job name" />
      <RhfTextField name="model" label="Model" />
      <RhfTextField name="prompt" label="Prompt" multiline minRows={3} />
      <RhfSelect name="status" label="Status" options={enumOptions(Object.values(AiJobStatus))} />
    </EntityForm>
  );
}

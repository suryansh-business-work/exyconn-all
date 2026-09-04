import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField, RhfAutocomplete } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { useCreateAiJobMutation, useUpdateAiJobMutation } from '@exyconn/shell/graphql/generated';
import { useAiModels } from '../../useAiModels';
import type { AiJobRow } from './ai-job.types';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  model: z.string().trim().min(1, 'Pick the model to run this on'),
  prompt: z.string().trim().min(3, 'Add a prompt of at least 3 characters'),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: AiJobRow | null): Values => ({
  name: row?.name ?? '',
  model: row?.model ?? '',
  prompt: row?.prompt ?? '',
});

interface AiJobFormProps {
  initial: AiJobRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * React Hook Form + Zod form to create or update an AI job. The status is not asked for:
 * a job starts queued and only running it moves it on.
 */
export function AiJobForm({ initial, onDone, onCancel }: Readonly<AiJobFormProps>) {
  const [createAiJob] = useCreateAiJobMutation();
  const [updateAiJob] = useUpdateAiJobMutation();
  const { options, defaultModel, error } = useAiModels();
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });
  const { setValue, getValues } = methods;

  // The default model arrives with the query, after the form has already mounted.
  useEffect(() => {
    if (defaultModel && !getValues('model')) {
      setValue('model', defaultModel);
    }
  }, [defaultModel, getValues, setValue]);

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
      <RhfAutocomplete
        name="model"
        label="Model"
        options={options}
        helperText={error ?? 'Models the active OpenAI key can reach'}
      />
      <RhfTextField name="prompt" label="Prompt" multiline minRows={4} />
    </EntityForm>
  );
}

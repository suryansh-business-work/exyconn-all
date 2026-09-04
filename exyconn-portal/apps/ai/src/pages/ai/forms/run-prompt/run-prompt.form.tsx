import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Text } from '@exyconn/shell/components/ui';
import { RhfAutocomplete } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useRunPromptMutation } from '@exyconn/shell/graphql/generated';
import { useAiModels } from '../../useAiModels';
import type { RunPromptTarget } from './run-prompt.types';

const schema = z.object({
  model: z.string().trim().min(1, 'Pick the model to run this on'),
});
type Values = z.infer<typeof schema>;

interface RunPromptFormProps {
  prompt: RunPromptTarget;
  /** Hands back the job the run created, so its result can be opened. */
  onDone: (jobId: string) => void;
  onCancel: () => void;
}

/** Runs a prompt-library entry as a new AI job, without retyping it into the jobs grid. */
export function RunPromptForm({ prompt, onDone, onCancel }: Readonly<RunPromptFormProps>) {
  const notify = useNotify();
  const [runPrompt] = useRunPromptMutation();
  const { options, defaultModel, error } = useAiModels();
  const methods = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { model: '' } });
  const { setValue, getValues } = methods;

  // The default model arrives with the query, after the dialog has already opened.
  useEffect(() => {
    if (defaultModel && !getValues('model')) {
      setValue('model', defaultModel);
    }
  }, [defaultModel, getValues, setValue]);

  const onSubmit = async (values: Values) => {
    try {
      const res = await runPrompt({ variables: { id: prompt.id, model: values.model } });
      const job = res.data?.runPrompt;
      if (!job) {
        return;
      }
      if (job.status === 'FAILED') {
        notify(job.error, 'error');
      } else {
        notify(`"${job.name}" finished · ${job.totalTokens.toLocaleString()} tokens`);
      }
      onDone(job.id);
    } catch (err) {
      notify(errorMessage(err, 'The run could not be started'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Run"
    >
      <Text size="sm" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
        {prompt.content}
      </Text>
      <RhfAutocomplete
        name="model"
        label="Model"
        options={options}
        helperText={error ?? 'Models the active OpenAI key can reach'}
      />
    </EntityForm>
  );
}

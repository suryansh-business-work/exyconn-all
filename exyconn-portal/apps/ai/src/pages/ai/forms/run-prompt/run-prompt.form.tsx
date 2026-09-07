import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Text } from '@exyconn/shell/components/ui';
import { RhfAutocomplete, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useRunPromptMutation } from '@exyconn/shell/graphql/generated';
import { useAiModels } from '../../useAiModels';
import { renderMergeFields, VARIABLE_FIELD_PREFIX } from './run-prompt.merge';
import type { RunPromptFormProps } from './run-prompt.types';

const schema = z.object({
  model: z.string().trim().min(1, 'Pick the model to run this on'),
  variables: z.record(z.string(), z.string()),
});
type Values = z.infer<typeof schema>;

/**
 * Runs a prompt-library entry as a new AI job, without retyping it into the jobs grid.
 *
 * A prompt with `{{placeholders}}` gets one field per placeholder, so the same saved
 * prompt serves every customer, release or candidate rather than being copied and edited.
 * Anything left blank renders as nothing — the server does the filling, so what runs is
 * exactly what the preview shows.
 */
export function RunPromptForm({ prompt, onDone, onCancel }: Readonly<RunPromptFormProps>) {
  const notify = useNotify();
  const [runPrompt] = useRunPromptMutation();
  const { options, defaultModel, error } = useAiModels();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      model: '',
      variables: Object.fromEntries(prompt.variables.map((name) => [name, ''])),
    },
  });
  const { setValue, getValues, watch } = methods;
  const filled = watch('variables');

  // The default model arrives with the query, after the dialog has already opened.
  useEffect(() => {
    if (defaultModel && !getValues('model')) {
      setValue('model', defaultModel);
    }
  }, [defaultModel, getValues, setValue]);

  const onSubmit = async (values: Values) => {
    try {
      const res = await runPrompt({
        variables: {
          id: prompt.id,
          model: values.model,
          variables: Object.entries(values.variables).map(([name, value]) => ({ name, value })),
        },
      });
      const job = res.data?.runPrompt;
      if (!job) {
        return;
      }
      notify(`"${job.name}" queued`);
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
        {renderMergeFields(prompt.content, filled ?? {})}
      </Text>
      {prompt.variables.map((name) => (
        <RhfTextField key={name} name={`${VARIABLE_FIELD_PREFIX}${name}`} label={name} />
      ))}
      <RhfAutocomplete
        name="model"
        label="Model"
        options={options}
        helperText={error ?? 'Models the active OpenAI key can reach'}
      />
    </EntityForm>
  );
}

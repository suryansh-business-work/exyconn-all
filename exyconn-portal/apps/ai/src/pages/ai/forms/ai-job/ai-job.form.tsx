import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Flex } from '@exyconn/shell/components/ui';
import { RhfTextField, RhfSelect } from '@exyconn/shell/components/form/rhf';
import { FormActions } from '@exyconn/shell/components/form/FormActions';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
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
  const notify = useNotify();
  const [createAiJob] = useCreateAiJobMutation();
  const [updateAiJob] = useUpdateAiJobMutation();
  const isEdit = Boolean(initial);
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const onSubmit = async (values: Values) => {
    try {
      if (isEdit && initial) await updateAiJob({ variables: { id: initial.id, input: values } });
      else await createAiJob({ variables: { input: values } });
      notify(`AI job ${isEdit ? 'updated' : 'created'}`);
      onDone();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Save failed', 'error');
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Flex direction="column" spacing={2.5}>
          <RhfTextField name="name" label="Job name" />
          <RhfTextField name="model" label="Model" />
          <RhfTextField name="prompt" label="Prompt" multiline minRows={3} />
          <RhfSelect
            name="status"
            label="Status"
            options={enumOptions(Object.values(AiJobStatus))}
          />
          <FormActions
            submitting={methods.formState.isSubmitting}
            isEdit={isEdit}
            onCancel={onCancel}
          />
        </Flex>
      </form>
    </FormProvider>
  );
}

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Flex } from '@exyconn/shell/components/ui';
import { RhfTextField, RhfSelect } from '@exyconn/shell/components/form/rhf';
import { FormActions } from '@exyconn/shell/components/form/FormActions';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  PromptCategory,
  useCreatePromptMutation,
  useUpdatePromptMutation,
} from '@exyconn/shell/graphql/generated';
import type { PromptRow } from './prompt.types';

const schema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  category: z.nativeEnum(PromptCategory),
  content: z.string().trim().min(1, 'Prompt content is required'),
  description: z.string().trim().max(300, 'Keep the description under 300 characters'),
  tags: z.string().trim().max(200, 'Keep tags under 200 characters'),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: PromptRow | null): Values => ({
  title: row?.title ?? '',
  category: row?.category ?? PromptCategory.General,
  content: row?.content ?? '',
  description: row?.description ?? '',
  tags: row?.tags?.join(', ') ?? '',
});

const parseTags = (raw: string): string[] =>
  raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

interface PromptFormProps {
  initial: PromptRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a library prompt. */
export function PromptForm({ initial, onDone, onCancel }: PromptFormProps) {
  const notify = useNotify();
  const [createPrompt] = useCreatePromptMutation();
  const [updatePrompt] = useUpdatePromptMutation();
  const isEdit = Boolean(initial);

  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const onSubmit = async (values: Values) => {
    const input = {
      title: values.title,
      category: values.category,
      content: values.content,
      description: values.description || null,
      tags: parseTags(values.tags),
    };
    try {
      if (isEdit && initial) await updatePrompt({ variables: { id: initial.id, input } });
      else await createPrompt({ variables: { input } });
      notify(`Prompt ${isEdit ? 'updated' : 'created'}`);
      onDone();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Save failed', 'error');
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Flex direction="column" spacing={2.5}>
          <RhfTextField name="title" label="Prompt title" />
          <RhfSelect
            name="category"
            label="Category"
            options={enumOptions(Object.values(PromptCategory))}
          />
          <RhfTextField name="content" label="Prompt" multiline minRows={4} />
          <RhfTextField name="description" label="Description (optional)" />
          <RhfTextField name="tags" label="Tags (comma separated)" />
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

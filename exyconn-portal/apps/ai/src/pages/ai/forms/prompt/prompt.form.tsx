import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField, RhfSelect } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
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

/** Maps the validated form values onto the GraphQL input. */
const toInput = (values: Values) => ({
  title: values.title,
  category: values.category,
  content: values.content,
  description: values.description || null,
  tags: parseTags(values.tags),
});

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
  const [createPrompt] = useCreatePromptMutation();
  const [updatePrompt] = useUpdatePromptMutation();

  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Prompt',
    initial,
    create: (values: Values) => createPrompt({ variables: { input: toInput(values) } }),
    update: (row, values) => updatePrompt({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="title" label="Prompt title" />
      <RhfSelect
        name="category"
        label="Category"
        options={enumOptions(Object.values(PromptCategory))}
      />
      <RhfTextField name="content" label="Prompt" multiline minRows={4} />
      <RhfTextField name="description" label="Description (optional)" />
      <RhfTextField name="tags" label="Tags (comma separated)" />
    </EntityForm>
  );
}

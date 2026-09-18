import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SLUG } from '@exyconn/regex';
import { RhfTextField, RhfSelect, RhfSwitch } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  SupportCategory,
  useCreateKbArticleMutation,
  useUpdateKbArticleMutation,
} from '@exyconn/shell/graphql/generated';
import type { KbArticleRow } from './kb-article.types';

const schema = z.object({
  title: z.string().trim().min(4, 'Give the article a title somebody could search for'),
  slug: z
    .string()
    .trim()
    .min(3, 'Slug must be at least 3 characters')
    .regex(SLUG, 'Lowercase letters, digits and hyphens only'),
  category: z.nativeEnum(SupportCategory),
  summary: z.string().trim().max(200, 'Keep the summary to one line'),
  body: z.string().trim().min(20, 'An answer this short will not help anybody'),
  isPublished: z.boolean(),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: KbArticleRow | null): Values => ({
  title: row?.title ?? '',
  slug: row?.slug ?? '',
  category: row?.category ?? SupportCategory.Other,
  summary: row?.summary ?? '',
  body: row?.body ?? '',
  isPublished: row?.isPublished ?? false,
});

interface KbArticleFormProps {
  initial: KbArticleRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * React Hook Form + Zod form for a knowledge-base article.
 *
 * The slug is entered rather than derived from the title on purpose: it is what links point
 * at, so it has to survive the title being reworded. Deriving it would silently break every
 * link the day somebody improved the wording.
 */
export function KbArticleForm({ initial, onDone, onCancel }: Readonly<KbArticleFormProps>) {
  const [createArticle] = useCreateKbArticleMutation();
  const [updateArticle] = useUpdateKbArticleMutation();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Article',
    initial,
    create: (values: Values) => createArticle({ variables: { input: values } }),
    update: (row, values) => updateArticle({ variables: { id: row.id, input: values } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="title" label="Title" />
      <RhfTextField name="slug" label="Slug" helperText="Stays put when the title is reworded" />
      <RhfSelect
        name="category"
        label="Category"
        options={enumOptions(Object.values(SupportCategory))}
      />
      <RhfTextField
        name="summary"
        label="Summary"
        helperText="One line — this is what search results show"
      />
      <RhfTextField name="body" label="Answer" multiline rows={10} />
      {/* Only published articles are searchable: a half-written answer is worse than none. */}
      <RhfSwitch name="isPublished" label="Published" />
    </EntityForm>
  );
}

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LINK, SLUG } from '@exyconn/regex';
import {
  RhfTextField,
  RhfChipsInput,
  RhfSwitch,
  RhfDatePicker,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  useCreateBlogPostMutation,
  useUpdateBlogPostMutation,
  type BlogPostInput,
} from '@exyconn/shell/graphql/generated';
import { ArticleBodyField } from '../../live-edit';
import { MEDIA_FOLDERS } from '../../live-edit/live-edit.config';
import type { BlogRow } from './blog-post.types';

const schema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, 'Slug is required')
    .regex(SLUG, 'Lower-case letters, numbers and hyphens only'),
  title: z.string().trim().min(1, 'Title is required'),
  summary: z.string(),
  content: z.string(),
  contentCss: z.string(),
  author: z.object({
    name: z.string().trim().min(1, 'Author name is required'),
    role: z.string(),
    initials: z.string(),
  }),
  readTime: z.string(),
  tags: z.array(z.string()),
  coverImage: z
    .string()
    .trim()
    .regex(LINK, 'Enter a full URL or a path starting with /')
    .or(z.literal('')),
  featured: z.boolean(),
  isActive: z.boolean(),
  publishedAt: z.string(),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: BlogRow | null): Values => ({
  slug: row?.slug ?? '',
  title: row?.title ?? '',
  summary: row?.summary ?? '',
  content: row?.content ?? '',
  contentCss: row?.contentCss ?? '',
  author: {
    name: row?.author.name ?? '',
    role: row?.author.role ?? '',
    initials: row?.author.initials ?? '',
  },
  readTime: row?.readTime ?? '',
  tags: row?.tags ?? [],
  coverImage: row?.coverImage ?? '',
  featured: row?.featured ?? false,
  isActive: row?.isActive ?? true,
  publishedAt: row?.publishedAt ?? '',
});

/** An empty date picker yields '', which is not a valid DateTime — send null instead. */
const toInput = (values: Values): BlogPostInput => ({
  ...values,
  publishedAt: values.publishedAt || null,
});

interface BlogPostFormProps {
  initial: BlogRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a blog post. */
export function BlogPostForm({ initial, onDone, onCancel }: Readonly<BlogPostFormProps>) {
  const [createBlogPost] = useCreateBlogPostMutation();
  const [updateBlogPost] = useUpdateBlogPostMutation();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Blog post',
    initial,
    create: (values: Values) => createBlogPost({ variables: { input: toInput(values) } }),
    update: (row, values) => updateBlogPost({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="slug" label="Slug" helperText="URL segment, e.g. scaling-graphql" />
      <RhfTextField name="title" label="Title" />
      <RhfTextField name="summary" label="Summary" multiline minRows={2} />
      <ArticleBodyField folder={MEDIA_FOLDERS.blog} />
      <RhfTextField name="author.name" label="Author name" />
      <RhfTextField name="author.role" label="Author role" />
      <RhfTextField name="author.initials" label="Author initials" />
      <RhfTextField name="readTime" label="Read time" helperText="e.g. 5 min read" />
      <RhfChipsInput name="tags" label="Tags" />
      <RhfTextField name="coverImage" label="Cover image URL" />
      <RhfSwitch name="featured" label="Featured" />
      <RhfSwitch name="isActive" label="Active" />
      <RhfDatePicker name="publishedAt" label="Published at" />
    </EntityForm>
  );
}

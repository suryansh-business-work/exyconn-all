import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Flex } from '@exyconn/shell/components/ui';
import {
  RhfTextField,
  RhfChipsInput,
  RhfSwitch,
  RhfDatePicker,
} from '@exyconn/shell/components/form/rhf';
import { FormActions } from '@exyconn/shell/components/form/FormActions';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  useCreateBlogPostMutation,
  useUpdateBlogPostMutation,
  type BlogPostInput,
} from '@exyconn/shell/graphql/generated';
import type { BlogRow } from './blog-post.types';

const schema = z.object({
  slug: z.string().trim().min(1, 'Slug is required'),
  title: z.string().trim().min(1, 'Title is required'),
  summary: z.string(),
  content: z.string(),
  author: z.object({
    name: z.string().trim().min(1, 'Author name is required'),
    role: z.string(),
    initials: z.string(),
  }),
  readTime: z.string(),
  tags: z.array(z.string()),
  coverImage: z.string(),
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
  const notify = useNotify();
  const [createBlogPost] = useCreateBlogPostMutation();
  const [updateBlogPost] = useUpdateBlogPostMutation();
  const isEdit = Boolean(initial);
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const onSubmit = async (values: Values) => {
    const input = toInput(values);
    try {
      if (isEdit && initial) await updateBlogPost({ variables: { id: initial.id, input } });
      else await createBlogPost({ variables: { input } });
      notify(`Blog post ${isEdit ? 'updated' : 'created'}`);
      onDone();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Save failed', 'error');
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Flex direction="column" spacing={2.5}>
          <RhfTextField name="slug" label="Slug" helperText="URL segment, e.g. scaling-graphql" />
          <RhfTextField name="title" label="Title" />
          <RhfTextField name="summary" label="Summary" multiline minRows={2} />
          <RhfTextField
            name="content"
            label="Content"
            multiline
            minRows={10}
            helperText="HTML is allowed — the body is rendered as-is on the public site."
          />
          <RhfTextField name="author.name" label="Author name" />
          <RhfTextField name="author.role" label="Author role" />
          <RhfTextField name="author.initials" label="Author initials" />
          <RhfTextField name="readTime" label="Read time" helperText="e.g. 5 min read" />
          <RhfChipsInput name="tags" label="Tags" />
          <RhfTextField name="coverImage" label="Cover image URL" />
          <RhfSwitch name="featured" label="Featured" />
          <RhfSwitch name="isActive" label="Active" />
          <RhfDatePicker name="publishedAt" label="Published at" />
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

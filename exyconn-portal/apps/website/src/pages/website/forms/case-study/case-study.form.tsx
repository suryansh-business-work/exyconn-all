import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  RhfTextField,
  RhfChipsInput,
  RhfSwitch,
  RhfDatePicker,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  useCreateCaseStudyMutation,
  useUpdateCaseStudyMutation,
  type CaseStudyInput,
} from '@exyconn/shell/graphql/generated';
import type { CaseStudyRow } from './case-study.types';

const schema = z.object({
  slug: z.string().trim().min(1, 'Slug is required'),
  title: z.string().trim().min(1, 'Title is required'),
  excerpt: z.string(),
  content: z.string(),
  coverImage: z.string(),
  category: z.string(),
  author: z.string(),
  tags: z.array(z.string()),
  pdfUrl: z.string(),
  featured: z.boolean(),
  isActive: z.boolean(),
  publishedAt: z.string(),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: CaseStudyRow | null): Values => ({
  slug: row?.slug ?? '',
  title: row?.title ?? '',
  excerpt: row?.excerpt ?? '',
  content: row?.content ?? '',
  coverImage: row?.coverImage ?? '',
  category: row?.category ?? '',
  author: row?.author ?? '',
  tags: row?.tags ?? [],
  pdfUrl: row?.pdfUrl ?? '',
  featured: row?.featured ?? false,
  isActive: row?.isActive ?? true,
  publishedAt: row?.publishedAt ?? '',
});

/** An empty date picker yields '', which is not a valid DateTime — send null instead. */
const toInput = (values: Values): CaseStudyInput => ({
  ...values,
  publishedAt: values.publishedAt || null,
});

interface CaseStudyFormProps {
  initial: CaseStudyRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a case study. */
export function CaseStudyForm({ initial, onDone, onCancel }: Readonly<CaseStudyFormProps>) {
  const [createCaseStudy] = useCreateCaseStudyMutation();
  const [updateCaseStudy] = useUpdateCaseStudyMutation();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Case study',
    initial,
    create: (values: Values) => createCaseStudy({ variables: { input: toInput(values) } }),
    update: (row, values) => updateCaseStudy({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="slug" label="Slug" helperText="URL segment, e.g. acme-migration" />
      <RhfTextField name="title" label="Title" />
      <RhfTextField name="excerpt" label="Excerpt" multiline minRows={2} />
      <RhfTextField
        name="content"
        label="Content"
        multiline
        minRows={8}
        helperText="HTML is allowed — the body is rendered as-is on the public site."
      />
      <RhfTextField name="coverImage" label="Cover image URL" />
      <RhfTextField name="category" label="Category" />
      <RhfTextField name="author" label="Author" />
      <RhfChipsInput name="tags" label="Tags" />
      <RhfTextField name="pdfUrl" label="PDF URL" />
      <RhfSwitch name="featured" label="Featured" />
      <RhfSwitch name="isActive" label="Active" />
      <RhfDatePicker name="publishedAt" label="Published at" />
    </EntityForm>
  );
}

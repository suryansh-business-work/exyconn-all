import { useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { z } from 'zod';
import { HTTP_URL, LINK, SLUG } from '@exyconn/regex';
import {
  RhfTextField,
  RhfChipsInput,
  RhfSwitch,
  RhfDatePicker,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { RhfMediaField } from '../../../cms/media';
import { useCurrentSiteId } from '../../../cms/site';
import {
  useCreateCaseStudyMutation,
  useUpdateCaseStudyMutation,
  type CaseStudyInput,
} from '@exyconn/shell/graphql/generated';
import { ArticleBodyField } from '../../live-edit';
import { MEDIA_FOLDERS } from '../../live-edit/live-edit.config';
import type { CaseStudyRow } from './case-study.types';
import { ItemSeoFields, itemSeoSchema, toItemSeoValues } from '../item-seo';

const schema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, 'Slug is required')
    .regex(SLUG, 'Lower-case letters, numbers and hyphens only'),
  title: z.string().trim().min(1, 'Title is required'),
  excerpt: z.string(),
  content: z.string(),
  contentCss: z.string(),
  coverImage: z
    .string()
    .trim()
    .regex(LINK, 'Enter a full URL or a path starting with /')
    .or(z.literal('')),
  category: z.string(),
  author: z.string(),
  tags: z.array(z.string()),
  pdfUrl: z
    .string()
    .trim()
    .regex(HTTP_URL, 'Enter a full URL starting with https://')
    .or(z.literal('')),
  featured: z.boolean(),
  isActive: z.boolean(),
  publishedAt: z.string(),
  seo: itemSeoSchema,
});
type Values = z.infer<typeof schema>;

const toInitial = (row: CaseStudyRow | null): Values => ({
  slug: row?.slug ?? '',
  title: row?.title ?? '',
  excerpt: row?.excerpt ?? '',
  content: row?.content ?? '',
  contentCss: row?.contentCss ?? '',
  coverImage: row?.coverImage ?? '',
  category: row?.category ?? '',
  author: row?.author ?? '',
  tags: row?.tags ?? [],
  pdfUrl: row?.pdfUrl ?? '',
  featured: row?.featured ?? false,
  isActive: row?.isActive ?? true,
  publishedAt: row?.publishedAt ?? '',
  seo: toItemSeoValues(row?.seo),
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
  const siteId = useCurrentSiteId();
  const [createCaseStudy] = useCreateCaseStudyMutation();
  const [updateCaseStudy] = useUpdateCaseStudyMutation();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Case study',
    initial,
    create: (values: Values) =>
      createCaseStudy({ variables: { input: { ...toInput(values), siteId } } }),
    update: (row, values) => updateCaseStudy({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="slug" label="Slug" helperText="URL segment, e.g. acme-migration" />
      <RhfTextField
        name="title"
        label="Title"
        helperText="The headline shown on the case study and in the list."
      />
      <RhfTextField
        name="excerpt"
        label="Excerpt"
        multiline
        minRows={2}
        helperText="Optional. One or two sentences shown in the case study list."
      />
      <ArticleBodyField folder={MEDIA_FOLDERS.caseStudies} />
      <RhfMediaField
        name="coverImage"
        label="Cover image"
        siteId={siteId}
        helperText="Optional. Shown at the top of the case study and on its card."
      />
      <RhfTextField
        name="category"
        label="Category"
        helperText="Optional. The industry or service it belongs to, e.g. Fintech."
      />
      <RhfTextField name="author" label="Author" helperText="Optional. Who wrote the case study." />
      <RhfChipsInput
        name="tags"
        label="Tags"
        helperText="Optional. Topics for the case study. Type one and press Enter."
      />
      <RhfTextField
        name="pdfUrl"
        label="PDF URL"
        helperText="Optional. A downloadable PDF version, starting with https://."
      />
      <RhfSwitch name="featured" label="Featured" />
      <RhfSwitch name="isActive" label="Active" />
      <RhfDatePicker
        name="publishedAt"
        label="Published at"
        helperText="Optional. The publication date shown with the case study."
      />
      <ItemSeoFields siteId={siteId} />
    </EntityForm>
  );
}

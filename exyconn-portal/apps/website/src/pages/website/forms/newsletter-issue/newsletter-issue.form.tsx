import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  RhfDatePicker,
  RhfRichText,
  RhfSwitch,
  RhfTextField,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  useCreateNewsletterIssueMutation,
  useUpdateNewsletterIssueMutation,
} from '@exyconn/shell/graphql/generated';
import { RhfMediaField } from '../../../cms/media';
import {
  issueSchema,
  toIssueValues,
  type NewsletterIssueFormValues,
  type NewsletterIssueRow,
} from './newsletter-issue.types';

interface NewsletterIssueFormProps {
  siteId: string;
  initial: NewsletterIssueRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form for a newsletter issue published on the site. */
export function NewsletterIssueForm({
  siteId,
  initial,
  onDone,
  onCancel,
}: Readonly<NewsletterIssueFormProps>) {
  const [createIssue] = useCreateNewsletterIssueMutation();
  const [updateIssue] = useUpdateNewsletterIssueMutation();
  const methods = useForm<NewsletterIssueFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(issueSchema),
    defaultValues: toIssueValues(initial),
  });
  // A body laid out elsewhere keeps its CSS; this form edits the text.
  const input = (values: NewsletterIssueFormValues) => ({
    ...values,
    siteId,
    contentCss: initial?.contentCss ?? '',
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Newsletter issue',
    initial,
    create: (values: NewsletterIssueFormValues) =>
      createIssue({ variables: { input: input(values) } }),
    update: (row, values) => updateIssue({ variables: { id: row.id, input: input(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="title" label="Title" />
      <RhfTextField name="slug" label="Slug" helperText="The issue's address: /newsletter/<slug>" />
      <RhfTextField
        name="summary"
        label="Summary"
        multiline
        minRows={2}
        helperText="Shown in the issue list and link previews."
      />
      <RhfMediaField name="coverImage" label="Cover image" siteId={siteId} />
      <RhfRichText name="content" label="Content" folder="website/newsletter" minHeight={320} />
      <RhfDatePicker name="publishedAt" label="Publish date" />
      <RhfSwitch name="isActive" label="Published on the site" />
    </EntityForm>
  );
}

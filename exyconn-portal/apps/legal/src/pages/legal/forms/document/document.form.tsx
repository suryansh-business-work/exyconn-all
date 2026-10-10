import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { HTTP_URL } from '@exyconn/regex';
import { RhfRichText, RhfTextField, RhfSelect } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { RichTextDownload } from '@exyconn/shell/components/form/RichTextDownload';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { Flex } from '@exyconn/shell/components/ui';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  DocumentCategory,
  DocumentStatus,
  useCreateLegalDocumentMutation,
  useGetLegalDocumentBodyQuery,
  useUpdateLegalDocumentMutation,
} from '@exyconn/shell/graphql/generated';
import { BodyGate } from '../BodyGate';
import { legalBody } from '../body.schema';
import type { LegalDocumentRow } from './document.types';

const schema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  category: z.enum(DocumentCategory),
  owner: z.string().trim().max(120, 'Keep the owner under 120 characters'),
  fileUrl: z.union([z.literal(''), z.string().trim().regex(HTTP_URL, 'Enter a valid URL')]),
  status: z.enum(DocumentStatus),
  content: legalBody,
});
type Values = z.infer<typeof schema>;

/** Maps the validated form values onto the GraphQL input. */
const toInput = (values: Values) => ({
  ...values,
  owner: values.owner || null,
  fileUrl: values.fileUrl || null,
});

const toInitial = (row: LegalDocumentRow | null, content: string): Values => ({
  title: row?.title ?? '',
  category: row?.category ?? DocumentCategory.Other,
  owner: row?.owner ?? '',
  fileUrl: row?.fileUrl ?? '',
  status: row?.status ?? DocumentStatus.Draft,
  content,
});

interface DocumentFormProps {
  initial: LegalDocumentRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** The fields, once the document's text is in hand. */
function DocumentFields({
  initial,
  content,
  onDone,
  onCancel,
}: Readonly<DocumentFormProps & { content: string }>) {
  const [createDocument] = useCreateLegalDocumentMutation();
  const [updateDocument] = useUpdateLegalDocumentMutation();

  const methods = useForm<Values>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial, content),
  });
  const [title, body] = useWatch({ control: methods.control, name: ['title', 'content'] });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Document',
    initial,
    create: (values: Values) => createDocument({ variables: { input: toInput(values) } }),
    update: (row, values) => updateDocument({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="title" label="Document title" />
      <RhfSelect
        name="category"
        label="Category"
        options={enumOptions(Object.values(DocumentCategory))}
      />
      <RhfTextField name="owner" label="Owner (optional)" />
      <RhfTextField name="fileUrl" label="File link (optional)" />
      <RhfSelect
        name="status"
        label="Status"
        options={enumOptions(Object.values(DocumentStatus))}
      />
      <RhfRichText
        name="content"
        label="Document"
        helperText="Headings, tables, lists and images all carry through to the PDF and Word downloads."
        folder="legal-documents"
        minHeight={360}
      />
      <Flex justifyContent="flex-end">
        <RichTextDownload title={title} html={body} />
      </Flex>
    </EntityForm>
  );
}

/**
 * React Hook Form + Zod form to create or update a legal document, its text written in the
 * rich-text editor. Editing loads the text first — the grid row does not carry it.
 */
export function DocumentForm({ initial, onDone, onCancel }: Readonly<DocumentFormProps>) {
  const { data, loading, error } = useGetLegalDocumentBodyQuery({
    variables: { id: initial?.id ?? '' },
    skip: !initial,
    fetchPolicy: 'network-only',
  });
  return (
    <BodyGate loading={loading} error={error}>
      <DocumentFields
        initial={initial}
        content={data?.getLegalDocument.content ?? ''}
        onDone={onDone}
        onCancel={onCancel}
      />
    </BodyGate>
  );
}

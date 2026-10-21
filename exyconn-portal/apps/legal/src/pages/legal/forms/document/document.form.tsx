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
  LegalItemKind,
  useCreateLegalDocumentMutation,
  useGetLegalDocumentBodyQuery,
  useUpdateLegalDocumentMutation,
} from '@exyconn/shell/graphql/generated';
import { LegalGroupField } from '@exyconn/shell/components/legal';
import { BodyGate } from '../BodyGate';
import { legalBody } from '../body.schema';
import type { LegalDocumentRow } from './document.types';

const schema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Keep the title under 200 characters'),
  category: z.enum(DocumentCategory),
  owner: z.string().trim().max(120, 'Keep the owner under 120 characters'),
  fileUrl: z.union([
    z.literal(''),
    z.string().trim().regex(HTTP_URL, 'Enter a full link starting with https://'),
  ]),
  status: z.enum(DocumentStatus),
  content: legalBody,
  // '' leaves it ungrouped.
  groupId: z.string(),
});
type Values = z.infer<typeof schema>;

/** Maps the validated form values onto the GraphQL input. */
const toInput = (values: Values) => ({
  ...values,
  owner: values.owner || null,
  fileUrl: values.fileUrl || null,
  groupId: values.groupId || null,
});

const toInitial = (row: LegalDocumentRow | null, content: string): Values => ({
  title: row?.title ?? '',
  category: row?.category ?? DocumentCategory.Other,
  owner: row?.owner ?? '',
  fileUrl: row?.fileUrl ?? '',
  status: row?.status ?? DocumentStatus.Draft,
  content,
  groupId: row?.groupId ?? '',
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
      <RhfTextField
        name="title"
        label="Document title"
        required
        placeholder="e.g. Data Processing Agreement 2026"
        helperText="The name people will search the register for."
      />
      <RhfSelect
        name="category"
        label="Category"
        required
        options={enumOptions(Object.values(DocumentCategory))}
        helperText="Groups the document in the register and its reports."
      />
      <RhfTextField
        name="owner"
        label="Owner"
        placeholder="e.g. Head of Legal"
        helperText="Optional. The person or team that keeps this document current."
      />
      <RhfTextField
        name="fileUrl"
        label="File link"
        placeholder="https://"
        helperText="Optional. A full https link to the signed or source file, if it lives elsewhere."
      />
      <RhfSelect
        name="status"
        label="Status"
        required
        options={enumOptions(Object.values(DocumentStatus))}
        helperText="Draft while it is being written; Active once it is in force."
      />
      <LegalGroupField kind={LegalItemKind.Document} />
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

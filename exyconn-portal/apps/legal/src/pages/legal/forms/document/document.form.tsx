import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField, RhfSelect } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  DocumentCategory,
  DocumentStatus,
  useCreateLegalDocumentMutation,
  useUpdateLegalDocumentMutation,
} from '@exyconn/shell/graphql/generated';
import type { LegalDocumentRow } from './document.types';

const schema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  category: z.nativeEnum(DocumentCategory),
  owner: z.string().trim().max(120, 'Keep the owner under 120 characters'),
  fileUrl: z.union([z.literal(''), z.string().trim().url('Enter a valid URL')]),
  status: z.nativeEnum(DocumentStatus),
});
type Values = z.infer<typeof schema>;

/** Maps the validated form values onto the GraphQL input. */
const toInput = (values: Values) => ({
  ...values,
  owner: values.owner || null,
  fileUrl: values.fileUrl || null,
});

const toInitial = (row: LegalDocumentRow | null): Values => ({
  title: row?.title ?? '',
  category: row?.category ?? DocumentCategory.Other,
  owner: row?.owner ?? '',
  fileUrl: row?.fileUrl ?? '',
  status: row?.status ?? DocumentStatus.Draft,
});

interface DocumentFormProps {
  initial: LegalDocumentRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a legal document. */
export function DocumentForm({ initial, onDone, onCancel }: DocumentFormProps) {
  const [createDocument] = useCreateLegalDocumentMutation();
  const [updateDocument] = useUpdateLegalDocumentMutation();

  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

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
    </EntityForm>
  );
}

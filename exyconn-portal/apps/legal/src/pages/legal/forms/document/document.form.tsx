import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Flex } from '@exyconn/shell/components/ui';
import { RhfTextField, RhfSelect } from '@exyconn/shell/components/form/rhf';
import { FormActions } from '@exyconn/shell/components/form/FormActions';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
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
  const notify = useNotify();
  const [createDocument] = useCreateLegalDocumentMutation();
  const [updateDocument] = useUpdateLegalDocumentMutation();
  const isEdit = Boolean(initial);

  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const onSubmit = async (values: Values) => {
    const input = { ...values, owner: values.owner || null, fileUrl: values.fileUrl || null };
    try {
      if (isEdit && initial) await updateDocument({ variables: { id: initial.id, input } });
      else await createDocument({ variables: { input } });
      notify(`Document ${isEdit ? 'updated' : 'created'}`);
      onDone();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Save failed', 'error');
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Flex direction="column" spacing={2.5}>
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

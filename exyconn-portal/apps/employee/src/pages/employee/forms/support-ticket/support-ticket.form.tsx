import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField, RhfSelect } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  AttachmentPicker,
  SUPPORT_UPLOAD_FOLDER,
  type AttachmentItem,
} from '@exyconn/shell/components/upload';
import {
  SupportCategory,
  SupportPriority,
  useCreateSupportTicketMutation,
} from '@exyconn/shell/graphql/generated';

const schema = z.object({
  subject: z.string().trim().min(1, 'Subject is required').min(3, 'Add a short subject'),
  category: z.nativeEnum(SupportCategory),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .min(10, 'Describe the issue in a bit more detail'),
  priority: z.nativeEnum(SupportPriority),
});
type Values = z.infer<typeof schema>;

const INITIAL: Values = {
  subject: '',
  category: SupportCategory.It,
  description: '',
  priority: SupportPriority.Medium,
};

/** React Hook Form + Zod form for an employee to raise a support ticket (status set to OPEN). */
export function SupportTicketForm({
  onCancel,
  onDone,
}: Readonly<{
  onCancel: () => void;
  onDone: () => void;
}>) {
  const notify = useNotify();
  const [createTicket] = useCreateSupportTicketMutation();
  // Files upload as they are picked, so they live beside the form rather than in it.
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const methods = useForm<Values>({ resolver: zodResolver(schema), defaultValues: INITIAL });

  const onSubmit = async (values: Values) => {
    try {
      await createTicket({ variables: { input: { ...values, attachments } } });
      notify('Support ticket raised');
      methods.reset();
      setAttachments([]);
      onDone();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not raise support ticket', 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Raise ticket"
    >
      <RhfTextField name="subject" label="Subject" />
      <RhfSelect
        name="category"
        label="Category"
        options={enumOptions(Object.values(SupportCategory))}
      />
      <RhfSelect
        name="priority"
        label="Priority"
        options={enumOptions(Object.values(SupportPriority))}
      />
      <RhfTextField name="description" label="Description" multiline minRows={3} />
      <AttachmentPicker
        value={attachments}
        onChange={setAttachments}
        folder={SUPPORT_UPLOAD_FOLDER}
      />
    </EntityForm>
  );
}

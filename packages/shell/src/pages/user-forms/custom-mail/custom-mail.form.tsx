import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField } from '@/components/form/rhf';
import { EntityForm } from '@/components/form/EntityForm';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { useSendUserMailMutation } from '@/graphql/generated';

const schema = z.object({
  subject: z.string().trim().min(1, 'Subject is required').min(3, 'Minimum 3 characters'),
  message: z.string().trim().min(1, 'Message is required').min(10, 'Minimum 10 characters'),
});
type Values = z.infer<typeof schema>;

interface CustomMailFormProps {
  userId: string;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to send an admin-composed email to a single user. */
export function CustomMailForm({ userId, onDone, onCancel }: CustomMailFormProps) {
  const notify = useNotify();
  const [sendUserMail] = useSendUserMailMutation();
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { subject: '', message: '' },
  });

  const onSubmit = async (values: Values) => {
    try {
      await sendUserMail({ variables: { id: userId, input: values } });
      notify('Email sent');
      onDone();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to send email', 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Send"
    >
      <RhfTextField name="subject" label="Subject" />
      <RhfTextField name="message" label="Message" multiline minRows={5} />
    </EntityForm>
  );
}

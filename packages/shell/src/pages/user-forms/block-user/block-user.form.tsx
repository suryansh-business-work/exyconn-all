import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField } from '@/components/form/rhf';
import { EntityForm } from '@/components/form/EntityForm';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { useSetUserBlockedMutation } from '@/graphql/generated';

const schema = z.object({
  reason: z.string().trim().min(1, 'A reason is required').min(3, 'Minimum 3 characters'),
});
type Values = z.infer<typeof schema>;

interface BlockUserFormProps {
  userId: string;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to temporarily block a user with a recorded reason. */
export function BlockUserForm({ userId, onDone, onCancel }: BlockUserFormProps) {
  const notify = useNotify();
  const [setUserBlocked] = useSetUserBlockedMutation();
  const methods = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { reason: '' } });

  const onSubmit = async (values: Values) => {
    try {
      await setUserBlocked({ variables: { id: userId, isBlocked: true, reason: values.reason } });
      notify('User blocked');
      onDone();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to block user', 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Block"
    >
      <RhfTextField
        name="reason"
        label="Reason for blocking"
        multiline
        minRows={3}
        helperText="Shown internally; the user only sees a generic blocked message at sign-in."
      />
    </EntityForm>
  );
}

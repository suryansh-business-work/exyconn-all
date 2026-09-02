import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField } from '@/components/form/rhf';
import { EntityForm } from '@/components/form/EntityForm';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { useChangePasswordMutation } from '@/graphql/generated';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(1, 'New password is required').min(6, 'Minimum 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    path: ['newPassword'],
    message: 'New password must differ from the current one',
  })
  .refine((d) => d.confirmPassword === d.newPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });
type Values = z.infer<typeof schema>;

const INITIAL: Values = { currentPassword: '', newPassword: '', confirmPassword: '' };

/** React Hook Form + Zod form to change the signed-in user's password. */
export function ChangePasswordForm() {
  const notify = useNotify();
  const [changePassword] = useChangePasswordMutation();
  const methods = useForm<Values>({ resolver: zodResolver(schema), defaultValues: INITIAL });

  const onSubmit = async (values: Values) => {
    try {
      await changePassword({
        variables: { currentPassword: values.currentPassword, newPassword: values.newPassword },
      });
      notify('Password changed successfully');
      methods.reset();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Change failed', 'error');
    }
  };

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit onCancel={() => methods.reset()}>
      <RhfTextField name="currentPassword" label="Current password" type="password" />
      <RhfTextField name="newPassword" label="New password" type="password" />
      <RhfTextField name="confirmPassword" label="Confirm new password" type="password" />
    </EntityForm>
  );
}

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField } from '@/components/form/rhf';
import { EntityForm } from '@/components/form/EntityForm';
import { useAuth } from '@/auth/AuthContext';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { useUpdateProfileMutation } from '@/graphql/generated';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required').min(2, 'Minimum 2 characters'),
});
type Values = z.infer<typeof schema>;

/** React Hook Form + Zod form to update the signed-in user's display name. */
export function ProfileForm() {
  const { user, updateUser } = useAuth();
  const notify = useNotify();
  const [updateProfile] = useUpdateProfileMutation();
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    values: { name: user?.name ?? '' },
  });

  const onSubmit = async (values: Values) => {
    try {
      await updateProfile({ variables: { input: { name: values.name } } });
      updateUser({ name: values.name });
      notify('Profile updated');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Update failed', 'error');
    }
  };

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit onCancel={() => methods.reset()}>
      <RhfTextField name="name" label="Full name" />
    </EntityForm>
  );
}

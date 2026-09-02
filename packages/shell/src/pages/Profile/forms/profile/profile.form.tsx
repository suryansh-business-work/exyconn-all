import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Flex } from '@/components/ui';
import { RhfTextField } from '@/components/form/rhf';
import { FormActions } from '@/components/form/FormActions';
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
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Flex direction="column" spacing={2.5}>
          <RhfTextField name="name" label="Full name" />
          <FormActions
            submitting={methods.formState.isSubmitting}
            isEdit
            onCancel={() => methods.reset()}
          />
        </Flex>
      </form>
    </FormProvider>
  );
}

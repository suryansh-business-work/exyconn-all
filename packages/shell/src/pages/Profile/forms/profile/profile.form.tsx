import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { isValidLocale, isValidTimezone } from '@exyconn/i18n';
import { RhfTextField } from '@/components/form/rhf';
import { EntityForm } from '@/components/form/EntityForm';
import { LocalePreferenceFields } from '@/components/localization';
import { useAuth } from '@/auth/AuthContext';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { useMeQuery, useUpdateProfileMutation } from '@/graphql/generated';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required').min(2, 'Minimum 2 characters'),
  // Empty means "follow the workspace default", which is a real answer, not a missing one.
  timezone: z
    .string()
    .refine((v) => v === '' || isValidTimezone(v), 'Choose a timezone from the list'),
  locale: z.string().refine((v) => v === '' || isValidLocale(v), 'Choose a language'),
});
type Values = z.infer<typeof schema>;

/**
 * The signed-in person's own details.
 *
 * Zone and language are theirs to change even though HR set them when the account was
 * created: only the person knows where they actually are, and somebody who travels or
 * relocates should not have to file a ticket to stop reading the office's clock.
 */
export function ProfileForm() {
  const { user, updateUser } = useAuth();
  const notify = useNotify();
  const { data, refetch } = useMeQuery({ fetchPolicy: 'cache-first' });
  const [updateProfile] = useUpdateProfileMutation();
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    values: {
      name: user?.name ?? '',
      timezone: data?.me.timezone ?? '',
      locale: data?.me.locale ?? '',
    },
  });

  const onSubmit = async (values: Values) => {
    try {
      await updateProfile({ variables: { input: values } });
      updateUser({ name: values.name });
      // The whole portal re-renders in the new language and zone off the back of this.
      await refetch();
      notify('Profile updated');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Update failed', 'error');
    }
  };

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit onCancel={() => methods.reset()}>
      <RhfTextField name="name" label="Full name" />
      <LocalePreferenceFields />
    </EntityForm>
  );
}

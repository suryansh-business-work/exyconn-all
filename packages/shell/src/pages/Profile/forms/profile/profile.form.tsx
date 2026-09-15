import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EntityForm } from '@/components/form/EntityForm';
import { useAuth } from '@/auth/AuthContext';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { errorMessage } from '@/utils/errorMessage';
import { useMeQuery, useUpdateProfileMutation } from '@/graphql/generated';
import { profileSchema } from './profile.schema';
import { AboutFields, PreferenceFields, SocialLinkFields } from './profile.fields';
import type { ProfileFormValues, ProfileInput, ProfileMe } from './profile.types';

/** The stored profile as form values: every missing value becomes '' (an empty field). */
function valuesOf(name: string, me: ProfileMe | undefined): ProfileFormValues {
  return {
    name,
    phone: me?.phone ?? '',
    brief: me?.brief ?? '',
    socialLinks: {
      linkedin: me?.socialLinks?.linkedin ?? '',
      github: me?.socialLinks?.github ?? '',
      twitter: me?.socialLinks?.twitter ?? '',
      website: me?.socialLinks?.website ?? '',
    },
    timezone: me?.timezone ?? '',
    locale: me?.locale ?? '',
  };
}

/**
 * The signed-in person's own details: who they are to colleagues (name, phone, bio, shared
 * profiles) and how the portal reads to them.
 *
 * Zone and language are theirs to change even though HR set them when the account was
 * created: only the person knows where they actually are, and somebody who travels or
 * relocates should not have to file a ticket to stop reading the office's clock. The email
 * is shown but locked — it is how they sign in, so only an administrator changes it.
 */
export function ProfileForm() {
  const { user, updateUser } = useAuth();
  const notify = useNotify();
  const { data, refetch } = useMeQuery({ fetchPolicy: 'cache-first' });
  const [updateProfile] = useUpdateProfileMutation();
  const methods = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: valuesOf(user?.name ?? '', data?.me),
  });

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      const input: ProfileInput = values;
      await updateProfile({ variables: { input } });
      updateUser({ name: values.name });
      // The whole portal re-renders in the new language and zone off the back of this.
      await refetch();
      notify('Profile updated');
    } catch (err) {
      notify(errorMessage(err, 'Update failed'), 'error');
    }
  };

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit onCancel={() => methods.reset()}>
      <AboutFields email={user?.email ?? ''} />
      <SocialLinkFields />
      <PreferenceFields />
    </EntityForm>
  );
}

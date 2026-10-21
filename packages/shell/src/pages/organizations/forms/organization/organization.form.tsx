import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@/components/form/zodResolver';
import { EntityForm } from '@/components/form/EntityForm';
import { useEntitySave } from '@/components/form/useEntitySave';
import {
  useCreateOrganizationMutation,
  useInviteOrganizationMembersMutation,
  useUpdateOrganizationMutation,
} from '@/graphql/generated';
import { OrganizationContactFields } from './organization-contact.fields';
import { OrganizationMembersFields } from './organization-members.fields';
import { OrganizationProfileFields } from './organization-profile.fields';
import { OrganizationSettingsFields } from './organization-settings.fields';
import {
  organizationSchema,
  toCreateInput,
  toInitial,
  toUpdateInput,
  type OrganizationValues,
} from './organization.schema';
import type { OrganizationRow } from './organization.types';

interface OrganizationFormProps {
  initial: OrganizationRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * Creates or edits a company on the platform, and on creation invites its first people.
 *
 * Only what a company cannot run without is required — a name and the money, language,
 * clock, year and tax rules its screens read. Every standard comes from the runtime's own
 * tables (ISO 3166-1, ISO 4217, IANA), and the server checks the same values.
 */
export function OrganizationForm({ initial, onDone, onCancel }: Readonly<OrganizationFormProps>) {
  const [createOrganization] = useCreateOrganizationMutation();
  const [updateOrganization] = useUpdateOrganizationMutation();
  const [inviteMembers] = useInviteOrganizationMembersMutation();
  const methods = useForm<OrganizationValues>({
    mode: 'onTouched',
    resolver: zodResolver(organizationSchema),
    defaultValues: toInitial(initial),
  });
  const timezone = useWatch({ control: methods.control, name: 'timezone' });

  const create = async (values: OrganizationValues) => {
    const { data } = await createOrganization({ variables: { input: toCreateInput(values) } });
    const organizationId = data?.createOrganization.id;
    if (organizationId && values.members.length > 0) {
      await inviteMembers({
        variables: {
          organizationId,
          members: values.members,
        },
      });
    }
  };

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Organization',
    initial,
    create,
    // The handle is what every record is filed under, so it is set once, at creation.
    update: (row, values) =>
      updateOrganization({ variables: { id: row.id, input: toUpdateInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <OrganizationProfileFields isEdit={isEdit} />
      <OrganizationContactFields />
      <OrganizationSettingsFields timezone={initial?.timezone ?? timezone} />
      {!isEdit && <OrganizationMembersFields />}
    </EntityForm>
  );
}

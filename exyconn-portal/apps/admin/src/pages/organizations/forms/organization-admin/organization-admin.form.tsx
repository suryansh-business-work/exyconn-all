import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EMAIL } from '@exyconn/regex';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { useAssignOrganizationAdminMutation } from '@exyconn/shell/graphql/generated';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().min(1, 'Email is required').regex(EMAIL, 'Enter a valid email'),
});
type Values = z.infer<typeof schema>;

interface OrganizationAdminFormProps {
  organizationId: string;
  organizationName: string;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * Appoints the person who administers a company.
 *
 * The platform creates exactly one account inside a company — this one. Everybody else is
 * added by that administrator, from inside their own portal. An account that already belongs
 * to another company is refused by the server; it cannot be in two.
 */
export function OrganizationAdminForm({
  organizationId,
  organizationName,
  onDone,
  onCancel,
}: Readonly<OrganizationAdminFormProps>) {
  const [assignAdmin] = useAssignOrganizationAdminMutation();
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '' },
  });

  const { onSubmit } = useEntitySave({
    label: 'Administrator for {organization}',
    labelValues: { organization: organizationName },
    initial: null,
    create: (values: Values) => assignAdmin({ variables: { organizationId, input: values } }),
    update: () => Promise.resolve(),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={false} onCancel={onCancel}>
      <RhfTextField name="name" label="Name" />
      <RhfTextField
        name="email"
        label="Email"
        type="email"
        helperText="They are emailed a password to sign in with"
      />
    </EntityForm>
  );
}

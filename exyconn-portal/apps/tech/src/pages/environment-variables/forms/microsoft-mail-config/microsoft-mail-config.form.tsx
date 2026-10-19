import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RhfSecretField, RhfSwitch, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  MicrosoftMailConfigDocument,
  useSaveMicrosoftMailConfigMutation,
} from '@exyconn/shell/graphql/generated';
import { KEEP_SECRET_HINT } from '../../secret';
import {
  makeMicrosoftMailSchema,
  toMicrosoftMailValues,
  type MicrosoftMailConfigRow,
  type MicrosoftMailFormValues,
} from './microsoft-mail-config.types';

/** React Hook Form + Zod form for the Microsoft Entra app the CRM's Microsoft mail connects with. */
export function MicrosoftMailConfigForm({
  initial,
}: Readonly<{ initial: MicrosoftMailConfigRow }>) {
  const notify = useNotify();
  const [save] = useSaveMicrosoftMailConfigMutation({
    refetchQueries: [MicrosoftMailConfigDocument],
  });
  const methods = useForm<MicrosoftMailFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(makeMicrosoftMailSchema(initial.hasClientSecret)),
    defaultValues: toMicrosoftMailValues(initial),
  });

  const onSubmit = async (values: MicrosoftMailFormValues) => {
    try {
      await save({ variables: { input: values } });
      methods.reset({ ...values, clientSecret: '' });
      notify('Microsoft Mail settings saved', 'success');
    } catch (error) {
      portalLogger.warn('tech: saving Microsoft Mail failed', error);
      notify(errorMessage(error, 'Could not save Microsoft Mail'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit
      submitLabel="Save changes"
      onCancel={() => methods.reset(toMicrosoftMailValues(initial))}
    >
      <RhfTextField
        name="clientId"
        label="Application (client) ID"
        helperText="Microsoft Entra admin center > App registrations > your app > Overview"
      />
      <RhfSecretField
        name="clientSecret"
        label="Client secret"
        stored={initial.hasClientSecret}
        helperText={
          initial.hasClientSecret
            ? KEEP_SECRET_HINT
            : 'Certificates & secrets > New client secret: copy its Value, not its ID'
        }
      />
      <RhfTextField
        name="tenant"
        label="Tenant"
        helperText="common (any work or personal account), organizations, consumers, or your directory (tenant) ID"
      />
      <RhfSwitch name="enabled" label="Let the CRM send email through Microsoft mailboxes" />
    </EntityForm>
  );
}

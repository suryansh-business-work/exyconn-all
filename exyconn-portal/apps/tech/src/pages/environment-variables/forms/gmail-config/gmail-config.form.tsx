import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RhfSecretField, RhfSwitch, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  GmailConfigDocument,
  TechSecret,
  useSaveGmailConfigMutation,
} from '@exyconn/shell/graphql/generated';
import { KEEP_SECRET_HINT } from '../../secret';
import { useTechSecretReveal } from '../../useTechSecretReveal';
import {
  makeGmailSchema,
  toGmailValues,
  type GmailConfigRow,
  type GmailFormValues,
} from './gmail-config.types';

/** React Hook Form + Zod form for the Google OAuth client the CRM's Gmail connects with. */
export function GmailConfigForm({ initial }: Readonly<{ initial: GmailConfigRow }>) {
  const notify = useNotify();
  const revealFor = useTechSecretReveal(initial.id);
  const [save] = useSaveGmailConfigMutation({ refetchQueries: [GmailConfigDocument] });
  const methods = useForm<GmailFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(makeGmailSchema(initial.hasClientSecret)),
    defaultValues: toGmailValues(initial),
  });

  const onSubmit = async (values: GmailFormValues) => {
    try {
      await save({ variables: { input: values } });
      methods.reset({ ...values, clientSecret: '' });
      notify('Gmail settings saved', 'success');
    } catch (error) {
      portalLogger.warn('tech: saving Gmail failed', error);
      notify(errorMessage(error, 'Could not save Gmail'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit
      submitLabel="Save changes"
      onCancel={() => methods.reset(toGmailValues(initial))}
    >
      <RhfTextField
        name="clientId"
        label="Client ID"
        helperText="Google Cloud console > APIs & Services > Credentials > OAuth client (Web application), with the Gmail API enabled"
      />
      <RhfSecretField
        name="clientSecret"
        label="Client secret"
        stored={initial.hasClientSecret}
        onReveal={revealFor(TechSecret.GmailClientSecret)}
        helperText={initial.hasClientSecret ? KEEP_SECRET_HINT : 'Shown next to the client ID'}
      />
      <RhfSwitch name="enabled" label="Let the CRM send and read email through Gmail" />
    </EntityForm>
  );
}

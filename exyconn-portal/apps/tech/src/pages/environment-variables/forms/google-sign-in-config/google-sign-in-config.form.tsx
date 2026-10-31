import { useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { RhfSecretField, RhfSwitch, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  GoogleSignInConfigDocument,
  TechSecret,
  useSaveGoogleSignInConfigMutation,
} from '@exyconn/shell/graphql/generated';
import { KEEP_SECRET_HINT } from '@exyconn/shell/utils/secret';
import { useTechSecretReveal } from '../../useTechSecretReveal';
import {
  makeGoogleSignInSchema,
  toGoogleSignInValues,
  type GoogleSignInConfigRow,
  type GoogleSignInFormValues,
} from './google-sign-in-config.types';

/** React Hook Form + Zod form for the Google OAuth client behind "Continue with Google". */
export function GoogleSignInConfigForm({ initial }: Readonly<{ initial: GoogleSignInConfigRow }>) {
  const notify = useNotify();
  const revealFor = useTechSecretReveal(initial.id);
  const [save] = useSaveGoogleSignInConfigMutation({
    refetchQueries: [GoogleSignInConfigDocument],
  });
  const methods = useForm<GoogleSignInFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(makeGoogleSignInSchema(initial.hasClientSecret)),
    defaultValues: toGoogleSignInValues(initial),
  });

  const onSubmit = async (values: GoogleSignInFormValues) => {
    try {
      await save({ variables: { input: values } });
      methods.reset({ ...values, clientSecret: '' });
      notify('Google sign-in saved', 'success');
    } catch (error) {
      portalLogger.warn('tech: saving Google sign-in failed', error);
      notify(errorMessage(error, 'Could not save Google sign-in'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit
      submitLabel="Save changes"
      onCancel={() => methods.reset(toGoogleSignInValues(initial))}
    >
      <RhfTextField
        name="clientId"
        label="Client ID"
        helperText="Google Cloud console > APIs & Services > Credentials > OAuth client (Web application)"
      />
      <RhfSecretField
        name="clientSecret"
        label="Client secret"
        stored={initial.hasClientSecret}
        onReveal={revealFor(TechSecret.GoogleSignInClientSecret)}
        helperText={initial.hasClientSecret ? KEEP_SECRET_HINT : 'Shown next to the client ID'}
      />
      <RhfSwitch name="enabled" label="Show Continue with Google on the portal sign-in" />
    </EntityForm>
  );
}

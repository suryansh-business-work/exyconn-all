import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useT } from '@exyconn/i18n';
import { Alert } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  SuppressionReason,
  useRemoveMarketingSuppressionMutation,
} from '@exyconn/shell/graphql/generated';
import { removeSuppressionSchema, type RemoveSuppressionValues } from './remove-suppression.types';

/** A recipient's own withdrawal of consent; only an administrator may lift it. */
const CONSENT_REASONS: ReadonlySet<SuppressionReason> = new Set([
  SuppressionReason.Unsubscribed,
  SuppressionReason.SpamComplaint,
]);

interface RemoveSuppressionFormProps {
  id: string;
  email: string;
  reason: SuppressionReason;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * Lets campaigns reach an address again. Deliberately slow: the address is typed back and a
 * reason given, and both go into the audit log.
 */
export function RemoveSuppressionForm({
  id,
  email,
  reason,
  onDone,
  onCancel,
}: Readonly<RemoveSuppressionFormProps>) {
  const t = useT();
  const notify = useNotify();
  const [remove] = useRemoveMarketingSuppressionMutation();
  const methods = useForm<RemoveSuppressionValues>({
    mode: 'onTouched',
    resolver: zodResolver(
      removeSuppressionSchema.refine((values) => values.confirmEmail.toLowerCase() === email, {
        path: ['confirmEmail'],
        message: 'Type the address exactly to confirm',
      }),
    ),
    defaultValues: { justification: '', confirmEmail: '' },
  });
  const submit = async (values: RemoveSuppressionValues) => {
    try {
      await remove({ variables: { id, justification: values.justification } });
      notify('{email} removed from the suppression list', 'success', { email });
      onDone();
    } catch (err) {
      notify(errorMessage(err, 'The suppression could not be removed'), 'error');
    }
  };
  return (
    <EntityForm
      methods={methods}
      onSubmit={submit}
      isEdit
      onCancel={onCancel}
      submitLabel="Remove suppression"
    >
      <Alert severity="error">
        {t(
          'Campaigns will be able to email {email} again. The removal and your reason are recorded.',
          { email },
        )}
      </Alert>
      {CONSENT_REASONS.has(reason) && (
        <Alert severity="warning">
          {t(
            'This person withdrew consent themselves. Only an administrator can remove it, and only with their renewed consent.',
          )}
        </Alert>
      )}
      <RhfTextField
        name="justification"
        label="Why are you removing it?"
        multiline
        rows={3}
        required
        helperText="For example: the person re-subscribed on the website on 3 March."
      />
      <RhfTextField
        name="confirmEmail"
        label="Type the address to confirm"
        required
        autoComplete="off"
        helperText={email}
      />
    </EntityForm>
  );
}

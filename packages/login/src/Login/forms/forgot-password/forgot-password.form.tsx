import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EMAIL } from '@exyconn/regex';
import { Text } from '@exyconn/shell/components/ui';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useRequestPasswordResetMutation } from '@exyconn/shell/graphql/generated';
import type { ForgotPasswordValues } from './forgot-password.types';

const schema = z.object({
  email: z.string().trim().min(1, 'Email is required').regex(EMAIL, 'Enter a valid email'),
});

/** Shown whatever the address is — the server never says which emails have accounts. */
export const RESET_REQUESTED_MESSAGE = 'If that address exists, a reset link is on its way.';

interface ForgotPasswordFormProps {
  onCancel: () => void;
  onDone: () => void;
}

/** Asks for the address to mail a one-hour reset link to. */
export function ForgotPasswordForm({ onCancel, onDone }: Readonly<ForgotPasswordFormProps>) {
  const notify = useNotify();
  const [requestReset] = useRequestPasswordResetMutation();
  const methods = useForm<ForgotPasswordValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    try {
      await requestReset({ variables: { email: values.email } });
      notify(RESET_REQUESTED_MESSAGE, 'success');
      onDone();
    } catch (error) {
      notify(errorMessage(error, 'Could not request a reset link'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Send reset link"
    >
      <Text size="sm" color="text.secondary">
        Enter the email you sign in with. If it has an account, a link to choose a new password will
        be sent to it. The link works once and expires in an hour.
      </Text>
      <RhfTextField name="email" label="Email" autoComplete="email" autoFocus />
    </EntityForm>
  );
}

import { useCallback } from 'react';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  EmailVerificationSource,
  useVerifyEmailMutation,
  type EmailVerificationBadgeFragment,
} from '@exyconn/shell/graphql/generated';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';

/**
 * Checks one CRM address now. Resolves to the result, or to null after telling the person why
 * the check could not run.
 */
export function useVerifyEmail(): (
  email: string,
) => Promise<EmailVerificationBadgeFragment | null> {
  const notify = useNotify();
  const [verify] = useVerifyEmailMutation();
  return useCallback(
    async (email: string) => {
      try {
        const result = await verify({ variables: { email, source: EmailVerificationSource.Crm } });
        return result.data?.verifyEmail ?? null;
      } catch (error) {
        notify(errorMessage(error, 'Could not check the email'), 'error');
        return null;
      }
    },
    [notify, verify],
  );
}

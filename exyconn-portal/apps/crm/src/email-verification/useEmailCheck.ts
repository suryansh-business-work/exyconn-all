import { useCallback } from 'react';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { EmailVerificationSource, useVerifyEmailMutation } from '@exyconn/shell/graphql/generated';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import type { EmailCheckContext } from './EmailCell';

/** Checks one CRM row's address now, then reloads the grid so its badge shows the result. */
export function useEmailCheck(reload: () => void): EmailCheckContext['verifyEmail'] {
  const notify = useNotify();
  const [verify] = useVerifyEmailMutation();
  return useCallback(
    async (email: string) => {
      try {
        await verify({ variables: { email, source: EmailVerificationSource.Crm } });
        reload();
      } catch (error) {
        notify(errorMessage(error, 'Could not check the email'), 'error');
      }
    },
    [notify, reload, verify],
  );
}

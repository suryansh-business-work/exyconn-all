import { useCallback } from 'react';
import type { EmailCheckContext } from './EmailCell';
import { useVerifyEmail } from './useVerifyEmail';

/** Checks one CRM row's address now, then reloads the grid so its badge shows the result. */
export function useEmailCheck(reload: () => void): EmailCheckContext['verifyEmail'] {
  const verify = useVerifyEmail();
  return useCallback(
    async (email: string) => {
      if (await verify(email)) {
        reload();
      }
    },
    [reload, verify],
  );
}

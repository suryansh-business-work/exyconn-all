import { useCallback, useState } from 'react';
import type { Logger } from '@exyconn/logger';
import type { SignInStep } from '../services/auth';
import { askWorker } from '../services/messaging';
import { errorText } from '../utils/errors';
import type { PasswordValues } from './forms/sign-in';

/**
 * Sign in / sign out through the worker. Signing in is two messages at most — the password,
 * then the two-factor code when it is on; the form shows their errors itself. Sign-out keeps
 * the in-flight flag and the last error here.
 */
export function useAuthActions(logger: Logger, onDone: () => void) {
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const signOut = useCallback(() => {
    setBusy(true);
    setFailure(null);
    askWorker({ type: 'auth/sign-out' })
      .then(onDone)
      .catch((error: unknown) => {
        logger.warn('Sign-out failed', error);
        setFailure(errorText(error, 'Something went wrong'));
      })
      .finally(() => setBusy(false));
  }, [logger, onDone]);

  const submitPassword = useCallback(
    ({ email, password, remember }: PasswordValues) =>
      askWorker<SignInStep>({ type: 'auth/sign-in', email, password, remember }).catch(
        (error: unknown) => {
          // Never the password: only that the step failed.
          logger.warn('Sign-in failed', error);
          throw error;
        },
      ),
    [logger],
  );

  const submitCode = useCallback(
    (challenge: string, code: string, remember: boolean) =>
      askWorker<SignInStep>({ type: 'auth/mfa', challenge, code, remember }).catch(
        (error: unknown) => {
          logger.warn('Two-factor sign-in failed', error);
          throw error;
        },
      ),
    [logger],
  );

  return { busy, error: failure, signOut, submitPassword, submitCode };
}

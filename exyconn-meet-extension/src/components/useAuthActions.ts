import { useCallback, useState } from 'react';
import type { Logger } from '@exyconn/logger';
import { askWorker } from '../services/messaging';
import { errorText } from '../utils/errors';

/** Sign in / sign out through the worker, with the in-flight flag and the last error. */
export function useAuthActions(logger: Logger, onDone: () => void) {
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const run = useCallback(
    (type: 'auth/sign-in' | 'auth/sign-out') => {
      setBusy(true);
      setFailure(null);
      askWorker({ type })
        .then(onDone)
        .catch((error: unknown) => {
          logger.warn('Sign-in action failed', error, { type });
          setFailure(errorText(error, 'Something went wrong'));
        })
        .finally(() => setBusy(false));
    },
    [logger, onDone],
  );

  return {
    busy,
    error: failure,
    signIn: () => run('auth/sign-in'),
    signOut: () => run('auth/sign-out'),
  };
}

import { useCallback, useState } from 'react';
import type { Logger } from '@exyconn/logger';
import { errorText } from '../utils/errors';

/** Runs one capture action at a time for a tab, tracking the one in flight and the last error. */
export function useCaptureActions(logger: Logger) {
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const run = useCallback(
    async (name: string, task: () => Promise<unknown>): Promise<boolean> => {
      setBusy(true);
      setFailure(null);
      try {
        await task();
        return true;
      } catch (error) {
        const message = errorText(error, 'Something went wrong');
        logger.warn('A capture action failed', error, { action: name });
        setFailure(message);
        return false;
      } finally {
        setBusy(false);
      }
    },
    [logger],
  );

  return { busy, error: failure, run };
}

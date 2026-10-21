import { useCallback, useState } from 'react';
import type { Logger } from '@exyconn/logger';
import { askWorker } from '../services/messaging';
import type { WorkerRequest } from '../types/messages';
import { errorText } from '../utils/errors';

type CaptureRequest = Extract<WorkerRequest, { type: `capture/${string}` }>['type'];

/**
 * Sends commands strictly in order — consent must be on record before start is asked for —
 * and stops at the first refusal.
 */
async function sendInOrder(
  types: readonly CaptureRequest[],
  tabId: number | undefined,
): Promise<void> {
  const [first, ...rest] = types;
  if (first === undefined) {
    return;
  }
  await askWorker({ type: first, tabId });
  await sendInOrder(rest, tabId);
}

/** Sends capture commands for one tab, tracking the one in flight and the last error. */
export function useCaptureActions(tabId: number | undefined, logger: Logger) {
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const run = useCallback(
    async (...types: CaptureRequest[]): Promise<boolean> => {
      setBusy(true);
      setFailure(null);
      try {
        await sendInOrder(types, tabId);
        return true;
      } catch (error) {
        const message = errorText(error, 'Something went wrong');
        logger.warn('A capture action failed', error, { types });
        setFailure(message);
        return false;
      } finally {
        setBusy(false);
      }
    },
    [tabId, logger],
  );

  return { busy, error: failure, run };
}

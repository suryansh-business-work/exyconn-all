import { useCallback, useEffect, useState } from 'react';
import type { Logger } from '@exyconn/logger';
import { askWorker } from '../services/messaging';
import type { StateBroadcast, WorkerState } from '../types/messages';
import { logTo } from '../services/logger';

function isBroadcast(message: unknown): message is StateBroadcast {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    message.type === 'state/changed'
  );
}

/**
 * The worker's state for one tab, kept live by its broadcasts. `tabId` undefined means "the
 * tab I am running in" (the content script); null means no Meet tab (the options page).
 */
export function useWorkerState(
  tabId: number | null | undefined,
  logger: Logger,
): { state: WorkerState | null; refresh: () => void } {
  const [state, setState] = useState<WorkerState | null>(null);

  const refresh = useCallback(() => {
    askWorker<WorkerState>({ type: 'state/get', tabId: tabId ?? undefined })
      .then(setState)
      .catch(logTo(logger, 'Could not read the assistant state'));
  }, [tabId, logger]);

  useEffect(() => {
    refresh();
    const listener = (message: unknown): undefined => {
      if (!isBroadcast(message)) {
        return undefined;
      }
      const forThisTab = tabId === undefined || message.state.tab?.tabId === tabId;
      if (forThisTab) {
        setState(message.state);
      }
      return undefined;
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [refresh, tabId]);

  return { state, refresh };
}

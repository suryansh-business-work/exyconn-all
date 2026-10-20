import { useCallback, useEffect, useState } from 'react';
import type { Logger } from '@exyconn/logger';
import { askWorker } from '../../services/messaging';
import type { PanelRequest, PanelResults } from '../../types/messages';
import { errorText } from '../../utils/errors';

export interface PanelQuery<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
}

/**
 * One panel read through the worker (the page never holds a token). Runs while the tab that
 * shows it is mounted and, when `pollMs` is set, polls — so nothing is fetched for a closed
 * panel. `enabled` false (no meeting yet) skips the request entirely.
 */
export function usePanelQuery<K extends PanelRequest['op']>(
  request: Extract<PanelRequest, { op: K }>,
  enabled: boolean,
  pollMs: number | null,
  logger: Logger,
): PanelQuery<PanelResults[K]> {
  const [data, setData] = useState<PanelResults[K] | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const key = JSON.stringify(request);

  const reload = useCallback(() => {
    if (!enabled) {
      return;
    }
    setLoading(true);
    askWorker<PanelResults[K]>({ type: 'panel/request', request: JSON.parse(key) as PanelRequest })
      .then((result) => {
        setData(result);
        setFailure(null);
      })
      .catch((error: unknown) => {
        logger.warn('A panel request failed', error, { op: request.op });
        setFailure(errorText(error, 'Something went wrong'));
      })
      .finally(() => setLoading(false));
  }, [enabled, key, logger, request.op]);

  useEffect(() => {
    reload();
    if (pollMs === null || !enabled) {
      return undefined;
    }
    const timer = setInterval(reload, pollMs);
    return () => clearInterval(timer);
  }, [reload, pollMs, enabled]);

  return { data, error: failure, loading, reload };
}

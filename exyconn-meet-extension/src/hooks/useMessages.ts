import { useEffect, useState } from 'react';
import type { Messages } from '@exyconn/i18n';
import type { Logger } from '@exyconn/logger';
import { askWorker } from '../services/messaging';
import { logTo } from '../services/logger';

const NONE: Messages = {};

/**
 * The portal's translations for the browser's language, fetched (and cached) by the worker.
 * The UI renders in English at once and switches when they land.
 */
export function useMessages(logger: Logger): Messages {
  const [messages, setMessages] = useState<Messages>(NONE);

  useEffect(() => {
    let live = true;
    askWorker<Messages>({ type: 'i18n/messages' })
      .then((loaded) => {
        if (live) {
          setMessages(loaded);
        }
      })
      .catch(logTo(logger, 'Could not load translations'));
    return () => {
      live = false;
    };
  }, [logger]);

  return messages;
}

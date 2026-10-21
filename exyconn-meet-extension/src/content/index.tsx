/**
 * The content script on https://meet.google.com/*. It reads only the visible page, reports
 * to the worker, and draws the assistant in a shadow root. It never holds a token: every
 * portal call goes through the worker.
 */
import { createExtensionLogger } from '../services/logger';
import { relayLogs } from '../services/messaging';
import { startController } from './controller';
import { mountAssistant } from './mount';

const logger = createExtensionLogger('meet-content', relayLogs);

const stopController = startController(logger);
const unmount = mountAssistant(logger);

globalThis.addEventListener('pagehide', (event) => {
  // A page kept in the back/forward cache comes back alive; only a real unload tears down.
  if (!event.persisted) {
    stopController();
    unmount();
  }
});

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { captureBrowserErrors } from '@exyconn/logger';
import { createExtensionLogger } from '../services/logger';
import { relayLogs } from '../services/messaging';
import { PopupRoot } from './PopupRoot';

const logger = createExtensionLogger('popup', relayLogs);
captureBrowserErrors(logger, globalThis);

const container = document.getElementById('root');
if (container === null) {
  throw new Error('Root container #root was not found');
}

createRoot(container).render(
  <StrictMode>
    <PopupRoot logger={logger} />
  </StrictMode>,
);

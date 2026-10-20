import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { captureBrowserErrors } from '@exyconn/logger';
import { createExtensionLogger } from '../services/logger';
import { relayLogs } from '../services/messaging';
import { OptionsRoot } from './OptionsRoot';

const logger = createExtensionLogger('options', relayLogs);
captureBrowserErrors(logger, globalThis);

const container = document.getElementById('root');
if (container === null) {
  throw new Error('Root container #root was not found');
}

createRoot(container).render(
  <StrictMode>
    <OptionsRoot logger={logger} />
  </StrictMode>,
);

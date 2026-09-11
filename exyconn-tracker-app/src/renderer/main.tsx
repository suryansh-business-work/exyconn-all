import '@fontsource-variable/inter/wght.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LogErrorBoundary } from '@exyconn/logger/react';
import App from './App';
import CrashFallback from './components/CrashFallback';
import { installRendererCrashHandlers, logger } from './logger';

installRendererCrashHandlers('main-window');

const container = document.getElementById('root');
if (container === null) {
  throw new Error('Root container #root was not found');
}

createRoot(container).render(
  <StrictMode>
    <LogErrorBoundary
      logger={logger}
      fallback={(error, reset) => <CrashFallback error={error} onRetry={reset} />}
    >
      <App />
    </LogErrorBoundary>
  </StrictMode>,
);

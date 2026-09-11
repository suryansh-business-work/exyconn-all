import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LogErrorBoundary } from '@exyconn/logger/react';
import ScreenshotsApp from './ScreenshotsApp';
import CrashFallback from './components/CrashFallback';
import { installRendererCrashHandlers, logger } from './logger';

installRendererCrashHandlers('screenshots-window');

/** The gallery window's entry point — a second renderer, built by electron-vite alongside the app. */
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
      <ScreenshotsApp />
    </LogErrorBoundary>
  </StrictMode>,
);

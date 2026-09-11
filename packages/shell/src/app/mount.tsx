import { StrictMode, type ReactElement } from 'react';
import { createRoot } from 'react-dom/client';
import { installPortalCrashHandlers } from '@/logging/portalLogger';
import { PageErrorBoundary } from '@/logging/PageErrorBoundary';

const ROOT_ID = 'root';

/**
 * Mounts a micro-frontend into the `#root` element its `index.html` provides, with every error
 * in it reported to Tech > Logs — including one that takes the whole app down.
 */
export function mountPortalApp(app: ReactElement): void {
  installPortalCrashHandlers();
  const container = document.getElementById(ROOT_ID);
  if (!container) {
    throw new Error(`Root container #${ROOT_ID} not found`);
  }
  createRoot(container).render(
    <StrictMode>
      <PageErrorBoundary>{app}</PageErrorBoundary>
    </StrictMode>,
  );
}

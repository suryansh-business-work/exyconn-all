import { StrictMode, type ReactElement } from 'react';
import { createRoot } from 'react-dom/client';

const ROOT_ID = 'root';

/** Mounts a micro-frontend into the `#root` element its `index.html` provides. */
export function mountPortalApp(app: ReactElement): void {
  const container = document.getElementById(ROOT_ID);
  if (!container) {
    throw new Error(`Root container #${ROOT_ID} not found`);
  }
  createRoot(container).render(<StrictMode>{app}</StrictMode>);
}

import { createRoot } from 'react-dom/client';
import type { Logger } from '@exyconn/logger';
import { ContentRoot } from './app/ContentRoot';

/**
 * Above Meet's video and toolbar, below its dialogs and menus (which sit far higher), so a
 * Meet prompt is never hidden behind the assistant.
 */
const HOST_Z_INDEX = '999';

/**
 * Mounts the assistant in an open Shadow DOM on its own host element: Meet's CSS cannot reach
 * in, and the assistant's cannot leak out. Returns the unmount function.
 */
export function mountAssistant(logger: Logger): () => void {
  const host = document.createElement('exyconn-meeting-assistant');
  host.style.setProperty('all', 'initial');
  host.style.setProperty('position', 'fixed');
  host.style.setProperty('z-index', HOST_Z_INDEX);
  const root = host.attachShadow({ mode: 'open' });
  const container = document.createElement('div');
  const portal = document.createElement('div');
  root.append(container, portal);
  document.documentElement.append(host);
  const reactRoot = createRoot(container);
  reactRoot.render(<ContentRoot logger={logger} shadow={{ root, portal }} />);
  return () => {
    reactRoot.unmount();
    host.remove();
  };
}

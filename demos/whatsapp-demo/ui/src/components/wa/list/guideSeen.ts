import { portalLogger } from '@exyconn/shell/logging/portalLogger';

/** Whether this browser has seen the guide: a per-viewer convenience, so storage errors are harmless. */
const KEY = 'exyconn.wa-demo.v1.guide-seen';

export function guideSeen(): boolean {
  try {
    return globalThis.localStorage.getItem(KEY) === '1';
  } catch (error) {
    portalLogger.warn('wa-demo: could not read whether the guide was seen', error);
    return false;
  }
}

export function markGuideSeen(): void {
  try {
    globalThis.localStorage.setItem(KEY, '1');
  } catch (error) {
    portalLogger.warn('wa-demo: could not remember that the guide was seen', error);
  }
}

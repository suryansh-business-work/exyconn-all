import { useEffect } from 'react';

/**
 * Asks the browser to warn before the tab is closed or reloaded while changes are unsaved.
 * In-app navigation is guarded by the studio's own Exit button.
 */
export function useLeaveGuard(unsaved: boolean): void {
  useEffect(() => {
    if (!unsaved) {
      return undefined;
    }
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    globalThis.addEventListener('beforeunload', warn);
    return () => globalThis.removeEventListener('beforeunload', warn);
  }, [unsaved]);
}

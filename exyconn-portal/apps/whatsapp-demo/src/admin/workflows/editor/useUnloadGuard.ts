import { useEffect } from 'react';

/** Asks the browser to warn before the tab closes or reloads while there is unsaved work. */
export function useUnloadGuard(active: boolean) {
  useEffect(() => {
    if (!active) {
      return undefined;
    }
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    globalThis.addEventListener('beforeunload', warn);
    return () => globalThis.removeEventListener('beforeunload', warn);
  }, [active]);
}

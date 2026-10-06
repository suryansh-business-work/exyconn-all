import { useEffect } from 'react';

/** Warns before the tab closes or reloads while there is unsaved work. */
export function useUnloadGuard(active: boolean): void {
  useEffect(() => {
    if (!active) {
      return undefined;
    }
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    globalThis.addEventListener('beforeunload', warn);
    return () => globalThis.removeEventListener('beforeunload', warn);
  }, [active]);
}

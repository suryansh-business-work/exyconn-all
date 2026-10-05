import { useSyncExternalStore } from 'react';

function subscribe(onChange: () => void): () => void {
  document.addEventListener('visibilitychange', onChange);
  return () => document.removeEventListener('visibilitychange', onChange);
}

const isVisible = () => document.visibilityState === 'visible';

/** Whether this tab is the one on screen right now. */
export function useDocumentVisible(): boolean {
  return useSyncExternalStore(subscribe, isVisible);
}

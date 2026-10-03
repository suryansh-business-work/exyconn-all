import { useCallback, useRef, useState } from 'react';

export interface Reload {
  /** Bumped by `reload`; a query effect lists it in its dependencies to run again. */
  attempt: number;
  /** Asks the portal again — pull-to-refresh, the phone's "try again". */
  reload: () => void;
  /**
   * Whether the effect running now was started by `reload` rather than by new arguments. A
   * reload refreshes what is on screen; new arguments (another month, another day) load afresh.
   */
  isReload: (attempt: number) => boolean;
}

/**
 * The reload half of a portal query. It is what lets pull-to-refresh keep the figures on screen
 * under the refresh spinner instead of swapping them for skeletons, which are only for the
 * first answer.
 */
export function useReload(): Reload {
  const [attempt, setAttempt] = useState(0);
  const seen = useRef(0);
  const reload = useCallback(() => setAttempt((count) => count + 1), []);
  const isReload = useCallback((current: number): boolean => {
    const fresh = current !== seen.current;
    seen.current = current;
    return fresh;
  }, []);
  return { attempt, reload, isReload };
}

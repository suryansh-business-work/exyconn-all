import { useCallback, useRef, useState } from 'react';
import { messageOf } from '../run';

export interface PendingAction<K extends string = string> {
  /** The action in flight, or null — its button shows the spinner, related buttons lock. */
  pending: K | null;
  /** The last failure, in words the employee can act on; cleared when the next action starts. */
  error: string | null;
  /**
   * Runs `action` under `key`. Resolves true when it succeeded; false when it failed (the error
   * is logged and shown) or when another action was still running.
   */
  perform: (key: K, action: () => Promise<unknown>, fallback: string) => Promise<boolean>;
  clearError: () => void;
}

/**
 * Busy and error state for actions that wait on the portal or the main process: one at a time,
 * a spinner on the one running, and a failure that is shown and logged rather than swallowed.
 */
export default function usePendingAction<K extends string = string>(): PendingAction<K> {
  const [pending, setPending] = useState<K | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** A ref as well as state, so a double click in one frame cannot start the action twice. */
  const running = useRef(false);

  const perform = useCallback(
    async (key: K, action: () => Promise<unknown>, fallback: string): Promise<boolean> => {
      if (running.current) {
        return false;
      }
      running.current = true;
      setPending(key);
      setError(null);
      try {
        await action();
        return true;
      } catch (cause: unknown) {
        console.error(`Action "${key}" failed`, cause);
        setError(messageOf(cause, fallback));
        return false;
      } finally {
        running.current = false;
        setPending(null);
      }
    },
    [],
  );

  const clearError = useCallback(() => setError(null), []);

  return { pending, error, perform, clearError };
}

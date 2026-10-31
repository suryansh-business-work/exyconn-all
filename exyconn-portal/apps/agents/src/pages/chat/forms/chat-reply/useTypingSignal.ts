import { useCallback, useEffect, useRef } from 'react';

/** "Still typing" goes at most this often; this long without a key press means "stopped". */
const TYPING_REPEAT_MS = 3000;

/**
 * Throttled typing frames for the visitor's widget: one "typing" when the agent starts, a
 * repeat every few seconds while they keep going, and "stopped" after a pause, on send or
 * when the page closes.
 */
export function useTypingSignal(signal: (on: boolean) => void) {
  const lastSent = useRef(0);
  const idle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latest = useRef(signal);
  latest.current = signal;

  const stopped = useCallback(() => {
    clearTimeout(idle.current);
    if (lastSent.current !== 0) {
      lastSent.current = 0;
      latest.current(false);
    }
  }, []);

  const typed = useCallback(() => {
    const now = Date.now();
    if (now - lastSent.current >= TYPING_REPEAT_MS) {
      lastSent.current = now;
      latest.current(true);
    }
    clearTimeout(idle.current);
    idle.current = setTimeout(stopped, TYPING_REPEAT_MS);
  }, [stopped]);

  useEffect(() => stopped, [stopped]);

  return { typed, stopped };
}

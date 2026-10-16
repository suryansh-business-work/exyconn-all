import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * The "Copied!" state of a copy button: on for a moment after a copy, then off again. The timer
 * is cancelled when the tool unmounts, so it never sets state on a component that is gone.
 */
export function useCopiedFlag(durationMs = 2000) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const flashCopied = useCallback(() => {
    clearTimeout(timer.current);
    setCopied(true);
    timer.current = setTimeout(() => setCopied(false), durationMs);
  }, [durationMs]);

  const resetCopied = useCallback(() => {
    clearTimeout(timer.current);
    setCopied(false);
  }, []);

  return { copied, flashCopied, resetCopied };
}

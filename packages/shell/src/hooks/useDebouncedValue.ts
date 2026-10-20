import { useEffect, useState } from 'react';

/**
 * The value once it has stopped changing for `delayMs`. For lookups driven by typing — one
 * request per pause rather than one per keystroke.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = globalThis.setTimeout(() => setSettled(value), delayMs);
    return () => globalThis.clearTimeout(timer);
  }, [value, delayMs]);
  return settled;
}

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Counts a grid's in-flight page requests. While any is pending `loading` is true and the
 * grid renders its container `inert`, so no search, sort, filter, page change or row action
 * can be queued behind the request already running. Whatever held focus inside the
 * container when the lock began — the search box, a column filter, a pager button — gets
 * it back once the rows arrive, so typing and keyboard navigation resume where they were.
 */
export function useLoadingLock() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pending = useRef(0);
  const focusBeforeLock = useRef<HTMLElement | null>(null);
  const [loading, setLoading] = useState(false);

  const begin = useCallback(() => {
    if (pending.current === 0) {
      const active = document.activeElement;
      const inside = active instanceof HTMLElement && containerRef.current?.contains(active);
      focusBeforeLock.current = inside ? active : null;
    }
    pending.current += 1;
    setLoading(true);
  }, []);

  const end = useCallback(() => {
    pending.current = Math.max(0, pending.current - 1);
    if (pending.current === 0) {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const target = focusBeforeLock.current;
    if (!loading && target?.isConnected) {
      target.focus();
      focusBeforeLock.current = null;
    }
  }, [loading]);

  return { containerRef, loading, begin, end };
}

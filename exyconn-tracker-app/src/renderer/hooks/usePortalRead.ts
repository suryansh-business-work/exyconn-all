import { useEffect, useState } from 'react';

export interface PortalRead<T> {
  data: T | null;
  loading: boolean;
  /** The read failed; the caller words it, so the sentence can be translated. */
  failed: boolean;
}

/**
 * One read through the main process, redone whenever `refreshKey` changes. A failure is
 * logged under `label` and reported, never thrown; the last good answer stays on screen.
 */
export default function usePortalRead<T>(
  read: () => Promise<T>,
  refreshKey: string,
  label: string,
): PortalRead<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    read()
      .then((next) => {
        if (active) {
          setData(next);
          setFailed(false);
          setLoading(false);
        }
      })
      .catch((cause: unknown) => {
        console.error(`Failed to load ${label}`, cause);
        if (active) {
          setFailed(true);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
    // `read` is rebuilt every render; the key alone says when the answer can have changed.
  }, [refreshKey, label]);

  return { data, loading, failed };
}

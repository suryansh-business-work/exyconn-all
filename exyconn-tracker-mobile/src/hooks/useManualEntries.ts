import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import type { ManualEntry } from '@exyconn/tracker-core';
import { tracker } from '../tracker/instance';
import { run } from '../tracker/run';

/**
 * How far back the list reaches. The portal refuses a claim older than 90 days, so there is
 * nothing further back that could still be acted on.
 */
const WINDOW_MS = 90 * 24 * 60 * 60 * 1000;

const LOAD_FAILED = 'Could not load your claims. Check your connection and try again.';

export interface ManualEntriesQuery {
  entries: ManualEntry[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * The signed-in employee's own claims for off-computer time, newest first.
 *
 * Read each time the screen comes to the front: the drawer keeps a visited screen mounted, and
 * the decisions this list shows are made in the portal while it sits behind the others.
 */
export function useManualEntries(): ManualEntriesQuery {
  const [entries, setEntries] = useState<ManualEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** Guards every setState against a screen that was left while a request was in flight. */
  const active = useRef(false);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    const now = Date.now();
    try {
      const rows = await tracker.getManualEntries(
        new Date(now - WINDOW_MS).toISOString(),
        new Date(now).toISOString(),
      );
      if (active.current) {
        setEntries(rows);
      }
    } catch (cause: unknown) {
      console.error('Failed to load off-computer time', cause);
      if (active.current) {
        setEntries([]);
        setError(LOAD_FAILED);
      }
    } finally {
      if (active.current) {
        setLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      active.current = true;
      run(load);
      return () => {
        active.current = false;
      };
    }, [load]),
  );

  const reload = useCallback(() => run(load), [load]);

  return { entries, loading, error, reload };
}

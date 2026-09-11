import { useSyncExternalStore } from 'react';
import { getSnapshot, subscribe } from '../tracker/instance';
import type { MobileTrackerState } from '../tracker/types';

/** The tracker's live state — null until the first snapshot after launch. */
export function useTrackerState(): MobileTrackerState | null {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

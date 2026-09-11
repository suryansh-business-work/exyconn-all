import { useSyncExternalStore } from 'react';
import { getUpdate, subscribeUpdate, type MobileUpdateState } from '../tracker/updates';

/** Where this install is in its update cycle — shared by the banner and Settings. */
export function useUpdateState(): MobileUpdateState {
  return useSyncExternalStore(subscribeUpdate, getUpdate, getUpdate);
}

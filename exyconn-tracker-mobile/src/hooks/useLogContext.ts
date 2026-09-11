import { usePathname } from 'expo-router';
import { useEffect } from 'react';
import { logger, setLogUser } from '../tracker/logger';
import { markRoute } from '../tracker/session-marker';
import type { MobileTrackerState } from '../tracker/types';

/**
 * Keeps Tech > Logs told which screen is open and who is signed in, so every error names both
 * and carries the screens that led to it.
 */
export function useLogContext(state: MobileTrackerState | null): void {
  const pathname = usePathname();
  const user = state?.user ?? null;
  const status = state?.status ?? 'loading';

  useEffect(() => {
    logger.setRoute(pathname);
    markRoute(pathname);
  }, [pathname]);

  useEffect(() => {
    setLogUser(user);
  }, [user]);

  useEffect(() => {
    logger.breadcrumb(`Tracker status ${status}`);
  }, [status]);
}

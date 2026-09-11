import { createTrackerLogger, type AuthUser } from '@exyconn/tracker-core';
import { loadedDeviceInfo } from './device-info';
import { documentFile } from './json-file';
import { portal } from './platform/shared';

let user: AuthUser | null = null;

/** Who to name on the next log — the root layout keeps this in step with the tracker state. */
export function setLogUser(next: AuthUser | null): void {
  user = next;
}

/**
 * The phone's Tech > Logs reporter. Its queue is a file, written before any send is tried, so
 * a crash that kills the app is still delivered on the next launch.
 */
export const logger = createTrackerLogger({
  source: 'MOBILE',
  app: 'tracker-mobile',
  portal,
  device: loadedDeviceInfo,
  user: () => user,
  storage: documentFile('tracker-logs.json'),
});

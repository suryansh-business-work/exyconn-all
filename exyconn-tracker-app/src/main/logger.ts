import { app } from 'electron';
import type { LogBatch } from '@exyconn/logger';
import {
  createTrackerLogger,
  logDeviceOf,
  type AuthUser,
  type DeviceInfo,
} from '@exyconn/tracker-core';
import { collectDeviceInfo } from './device-info';
import { userDataFile } from './file-storage';
import { reportClientLogs } from './portal-client';

let user: AuthUser | null = null;
let device: DeviceInfo | null = null;

/** Who to name on the next log — kept in step with the tracker state by `broadcast`. */
export function setLogUser(next: AuthUser | null): void {
  user = next;
}

/** Read once the app is ready (it needs the screen module); a log before then goes unlabelled. */
function readDevice(): DeviceInfo | null {
  if (device === null && app.isReady()) {
    device = collectDeviceInfo();
  }
  return device;
}

/**
 * The desktop's Tech > Logs reporter, for the main process and — through `forwardRendererLogs`
 * — both renderer windows. The queue is a file under userData, so a crash is sent next launch.
 */
export const logger = createTrackerLogger({
  source: 'DESKTOP',
  app: 'tracker-desktop',
  portal: { reportClientLogs },
  device: readDevice,
  user: () => user,
  storage: userDataFile('tracker-logs.json'),
});

/**
 * A renderer's batch, stamped with what only the main process knows — the device and the
 * signed-in user — and sent with the device token. A renderer cannot reach the portal itself.
 */
export function forwardRendererLogs(batch: LogBatch): Promise<boolean> {
  return reportClientLogs({ ...batch, ...logDeviceOf(readDevice()), user });
}

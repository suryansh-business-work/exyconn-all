import { createLogger, type LogDevice, type Logger, type LogStorage } from '@exyconn/logger';
import type { PortalClient } from './portal/client';
import type { AuthUser, DeviceInfo } from './types';

export interface TrackerLoggerConfig {
  source: 'DESKTOP' | 'MOBILE';
  app: string;
  portal: Pick<PortalClient, 'reportClientLogs'>;
  /** Null until the app has read it — a log from the first moments still goes out, unlabelled. */
  device: () => DeviceInfo | null;
  user: () => AuthUser | null;
  storage: LogStorage;
}

/** The part of the tracker's device record a log carries. */
export function logDeviceOf(device: DeviceInfo | null): LogDevice {
  if (!device) {
    return { appVersion: null, platform: null, osVersion: null, deviceModel: null, deviceId: null };
  }
  return {
    appVersion: device.appVersion,
    platform: device.platform,
    osVersion: device.osVersion,
    deviceModel: [device.cpuModel, device.arch].filter(Boolean).join(' '),
    deviceId: device.deviceId,
  };
}

/**
 * The tracker's Tech > Logs reporter — the same queue, batching and portal call on the desktop
 * and on phones. Each app hands in only where the queue is kept and how to read its device and
 * user; its own crash handlers feed the logger this returns.
 */
export function createTrackerLogger(config: TrackerLoggerConfig): Logger {
  return createLogger({
    source: config.source,
    app: config.app,
    storage: config.storage,
    device: () => logDeviceOf(config.device()),
    user: config.user,
    send: (batch) => config.portal.reportClientLogs(batch),
  });
}

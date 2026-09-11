import {
  captureBrowserErrors,
  captureConsole,
  createLogger,
  type LogDevice,
  type LogStorage,
} from '@exyconn/logger';

/** The main process stamps the real device and user on (main/logger.ts `forwardRendererLogs`). */
const STAMPED_BY_MAIN: LogDevice = {
  appVersion: null,
  platform: null,
  osVersion: null,
  deviceModel: null,
  deviceId: null,
};

/** One queue per window — both windows share an origin, and so a localStorage. */
function windowStorage(): LogStorage {
  const key = `exyconn.tracker.logs:${window.location.pathname}`;
  return {
    read: () => localStorage.getItem(key),
    write: (value) => localStorage.setItem(key, value),
  };
}

/**
 * This window's Tech > Logs reporter. A renderer holds no token and cannot reach the portal,
 * so its batches go to the main process over IPC, which sends them on.
 */
export const logger = createLogger({
  source: 'DESKTOP',
  app: 'tracker-desktop',
  send: (batch) => window.tracker.reportLogs(batch),
  device: () => STAMPED_BY_MAIN,
  user: () => null,
  storage: windowStorage(),
});

/** Uncaught errors, unhandled rejections and `console.error`/`warn` in this window. */
export function installRendererCrashHandlers(windowName: string): void {
  captureConsole(logger);
  captureBrowserErrors(logger, window);
  logger.setRoute(windowName);
}

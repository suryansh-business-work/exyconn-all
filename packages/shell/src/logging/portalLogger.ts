import {
  captureBrowserErrors,
  captureConsole,
  createLogger,
  type LogBatch,
  type LogStorage,
} from '@exyconn/logger';
import { env } from '@/config/env';
import { userStore } from '@/auth/userStore';

type LogTransport = (batch: LogBatch) => Promise<unknown>;

let transport: LogTransport | null = null;

/**
 * Plugged in by the Apollo client module, which itself reports to this logger — injecting the
 * send keeps the two modules from importing each other.
 */
export function setLogTransport(send: LogTransport): void {
  transport = send;
}

const STORAGE_KEY = `exyconn.portal.logs:${env.portalApp}`;

const storage: LogStorage = {
  read: () => localStorage.getItem(STORAGE_KEY),
  write: (value) => localStorage.setItem(STORAGE_KEY, value),
};

/**
 * This portal app's Tech > Logs reporter. The queue is kept in localStorage, so an error just
 * before a reload or a hop to another portal app still goes out. The browser's user agent is
 * recorded by the server from the request itself.
 */
export const portalLogger = createLogger({
  source: 'PORTAL',
  app: env.portalApp,
  send: (batch) => {
    if (transport === null) {
      return Promise.reject(new Error('The log transport is not connected yet'));
    }
    return transport(batch);
  },
  device: () => ({
    appVersion: null,
    platform: 'web',
    osVersion: null,
    deviceModel: null,
    deviceId: null,
  }),
  user: () => {
    const user = userStore.get();
    return user ? { id: user.id, name: user.name, email: user.email } : null;
  },
  storage,
});

/** Uncaught errors, unhandled rejections and `console.error`/`warn` anywhere in the page. */
export function installPortalCrashHandlers(): void {
  captureConsole(portalLogger);
  captureBrowserErrors(portalLogger, window);
}

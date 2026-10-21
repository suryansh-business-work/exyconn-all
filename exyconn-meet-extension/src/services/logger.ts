import { createLogger, type LogBatch, type Logger } from '@exyconn/logger';
import { EXTENSION_VERSION } from '../config';

/** Tech > Logs groups the extension under this app name. */
export const LOG_APP = 'meet-extension';

/**
 * A Tech > Logs reporter for one extension context. The portal has no EXTENSION source, so
 * the extension reports as a browser client (PORTAL) under its own app name. The user is
 * never attached: the server reads it from the token, and logs carry no PII, tokens or
 * transcript text.
 */
export function createExtensionLogger(
  context: string,
  send: (batch: LogBatch) => Promise<unknown>,
): Logger {
  const logger = createLogger({
    source: 'PORTAL',
    app: LOG_APP,
    send,
    device: () => ({
      appVersion: EXTENSION_VERSION,
      platform: 'chrome-extension',
      osVersion: null,
      deviceModel: null,
      deviceId: null,
    }),
    user: () => null,
  });
  logger.setRoute(context);
  return logger;
}

/**
 * A `.catch` handler that reports the failure to Tech > Logs — so no promise is left floating
 * and no failure is dropped silently: `promise.catch(logTo(logger, 'Could not save'))`.
 */
export function logTo(
  logger: Pick<Logger, 'warn' | 'error'>,
  message: string,
  level: 'warn' | 'error' = 'warn',
): (error: unknown) => void {
  return (error) => logger[level](message, error);
}

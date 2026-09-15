import pino from 'pino';
import { env } from '../config/env';

/**
 * Paths pino blanks before a line is written. Request headers carry sessions and keys, and
 * any logged object can hold a credential one level down — a log line is read by more
 * people, and kept longer, than the secret it would leak.
 */
export const REDACTED_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-api-key"]',
  'headers.authorization',
  'headers.cookie',
  'headers["x-api-key"]',
  // Top-level and one level down (`{ input: { password } }`); pino's `*` matches one key.
  'password',
  'passwordHash',
  'token',
  'apiKey',
  'privateKey',
  'botToken',
  'secret',
  'keyValue',
  '*.password',
  '*.passwordHash',
  '*.token',
  '*.apiKey',
  '*.privateKey',
  '*.botToken',
  '*.secret',
  '*.keyValue',
];

export const LOG_REDACTION = { paths: REDACTED_PATHS, censor: '[redacted]' };

/** Application-wide logger (singleton). */
export const logger = pino({
  level: env.isProduction ? 'info' : 'debug',
  redact: LOG_REDACTION,
  transport: env.isProduction
    ? undefined
    : { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } },
});

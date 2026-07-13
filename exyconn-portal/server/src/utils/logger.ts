import pino from 'pino';
import { env } from '../config/env';

/** Application-wide logger (singleton). */
export const logger = pino({
  level: env.isProduction ? 'info' : 'debug',
  transport: env.isProduction
    ? undefined
    : { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } },
});

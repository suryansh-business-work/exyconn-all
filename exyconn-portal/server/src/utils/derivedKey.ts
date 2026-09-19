import { hkdfSync } from 'node:crypto';
import { env } from '../config/env';

/**
 * A 256-bit key for one purpose, derived from the JWT secret — so there is no second secret to
 * deploy, and one purpose's key never works for another. Rotating the JWT secret rotates them all.
 */
export const derivedKey = (purpose: string): Buffer =>
  Buffer.from(hkdfSync('sha256', env.jwtSecret, 'exyconn', purpose, 32));

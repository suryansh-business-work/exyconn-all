import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto';
import { env } from '../config/env';

/**
 * Encryption at rest for credentials the server must use again later — a connected social
 * account's access and refresh tokens. AES-256-GCM with a key derived from the JWT secret, so
 * there is no second secret to deploy; rotating that secret means reconnecting the accounts.
 * The stored form is `v1.<iv>.<tag>.<ciphertext>`, each part base64url.
 */
const VERSION = 'v1';
const IV_BYTES = 12;

const key = (): Buffer =>
  Buffer.from(hkdfSync('sha256', env.jwtSecret, 'exyconn', 'social-account-tokens', 32));

export function seal(plain: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const body = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return [VERSION, iv, cipher.getAuthTag(), body]
    .map((part) => (typeof part === 'string' ? part : part.toString('base64url')))
    .join('.');
}

export function open(sealed: string): string {
  const [version, iv, tag, body] = sealed.split('.');
  if (version !== VERSION || !iv || !tag || !body) {
    throw new Error('Not a sealed value');
  }
  const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(body, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

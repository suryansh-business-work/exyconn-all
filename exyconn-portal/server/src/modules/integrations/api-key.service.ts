import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { ApiKeyModel, type ApiKeyDocument } from './api-key.model';
import type { Role } from '../../constants/roles';
import { logger } from '../../utils/logger';

/** Every key starts with this, so one is recognisable on sight in a log or a config file. */
const KEY_PREFIX = 'exy';

/** SHA-256, not bcrypt: a key is 32 random bytes, so there is no low-entropy guess to slow. */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export interface IssuedApiKey {
  /** The ONLY time the plaintext exists. Never stored, never recoverable. */
  key: string;
  prefix: string;
  keyHash: string;
}

/** Mints a key: a readable prefix, and 32 random bytes that are the actual secret. */
export function generateApiKey(): IssuedApiKey {
  const prefix = `${KEY_PREFIX}_${randomBytes(4).toString('hex')}`;
  const secret = randomBytes(32).toString('base64url');
  const key = `${prefix}_${secret}`;
  return { key, prefix, keyHash: hashApiKey(key) };
}

/** Two hex digests compared without leaking, through their length, where they differ. */
function hashesMatch(a: string, b: string): boolean {
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  return left.length === right.length && timingSafeEqual(left, right);
}

/** A key that is live: not revoked, and not past an expiry it was given. */
function isUsable(row: ApiKeyDocument, now: Date): boolean {
  if (row.revokedAt) {
    return false;
  }
  return !row.expiresAt || row.expiresAt.getTime() > now.getTime();
}

export interface ApiKeyPrincipal {
  id: string;
  name: string;
  roles: Role[];
}

/**
 * Resolves a presented key to what it may do, or null.
 *
 * The lookup is by HASH, so the plaintext is never queried and never logged by the driver.
 * `lastUsedAt` is written without awaiting: a credential check must not wait on a stat.
 */
export async function principalForApiKey(
  presented: string,
  now: Date = new Date(),
): Promise<ApiKeyPrincipal | null> {
  const trimmed = presented.trim();
  if (!trimmed.startsWith(`${KEY_PREFIX}_`)) {
    return null;
  }

  const row = await ApiKeyModel.findOne({ keyHash: hashApiKey(trimmed) });
  if (!row || !isUsable(row, now) || !hashesMatch(row.keyHash, hashApiKey(trimmed))) {
    return null;
  }

  // Deliberately not awaited: a credential check must not wait on a usage stat. The catch is
  // what keeps a failed stat from becoming an unhandled rejection.
  ApiKeyModel.updateOne({ _id: row._id }, { lastUsedAt: now }).catch((error: unknown) =>
    logger.error(error, 'Stamping an API key’s last use failed'),
  );

  return { id: String(row._id), name: row.name, roles: row.roles as Role[] };
}

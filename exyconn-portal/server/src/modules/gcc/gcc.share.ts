import { randomBytes, timingSafeEqual } from 'node:crypto';
import { enforceLimit } from '../../lib/rateLimiter';
import { badRequest } from '../../utils/errors';
import { hashShareToken } from '../projects/share.service';
import { assertCaptcha } from '../website/website.captcha';
import type { CaptchaInput } from './gcc.email';
import { readEstimate } from './gcc.estimate';
import { shareCreateLimiter, shareReadLimiter } from './gcc.limits';
import { GccShareModel } from './gcc.model';

/** 32 random bytes, hex: the share token and the revoke key are each 64 characters. */
const SECRET_BYTES = 32;
const SECRET_PATTERN = /^[a-f\d]{64}$/;
const MAX_EXPIRY_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface GccShareInput {
  estimateJson: string;
  expiresInDays: number;
  consent: boolean;
}

export interface GccShareCreated {
  token: string;
  revokeKey: string;
  expiresAt: Date;
}

const newSecret = () => randomBytes(SECRET_BYTES).toString('hex');

/** A share is followed only while unexpired and unrevoked (the TTL purge runs about once a minute). */
const liveFilter = (token: string, now: Date) => ({
  tokenHash: hashShareToken(token),
  revokedAt: null,
  expiresAt: { $gt: now },
});

/**
 * Stores an estimate behind a new link. The visitor must have agreed to it being stored; the
 * token and revoke key are returned here and nowhere else — only their hashes are kept.
 */
export async function createGccShare(
  input: GccShareInput,
  captcha: CaptchaInput,
  ip: string,
  now = new Date(),
): Promise<GccShareCreated> {
  if (!input.consent) {
    badRequest('Agree to the estimate being stored to create a link.');
  }
  if (
    !Number.isInteger(input.expiresInDays) ||
    input.expiresInDays < 1 ||
    input.expiresInDays > MAX_EXPIRY_DAYS
  ) {
    badRequest(`A link must expire between 1 and ${MAX_EXPIRY_DAYS} days from now.`);
  }
  // Validated before storing; stored as received, so totals are always recomputed on read.
  readEstimate(input.estimateJson);
  await enforceLimit(shareCreateLimiter, ip, 'share links');
  await assertCaptcha(captcha.token, captcha.answer);

  const token = newSecret();
  const revokeKey = newSecret();
  const expiresAt = new Date(now.getTime() + input.expiresInDays * MS_PER_DAY);
  await GccShareModel.create({
    tokenHash: hashShareToken(token),
    revokeKeyHash: hashShareToken(revokeKey),
    estimateJson: input.estimateJson,
    expiresAt,
  });
  return { token, revokeKey, expiresAt };
}

/**
 * The shared estimate, or null when the token is malformed, unknown, expired or revoked — all
 * alike, so a caller learns nothing about which tokens exist.
 */
export async function sharedGccEstimate(
  token: string,
  ip: string,
  now = new Date(),
): Promise<{ estimateJson: string; expiresAt: Date } | null> {
  await enforceLimit(shareReadLimiter, ip, 'share link lookups');
  if (!SECRET_PATTERN.test(token)) {
    return null;
  }
  const share = await GccShareModel.findOne(liveFilter(token, now))
    .select('estimateJson expiresAt')
    .lean();
  return share ? { estimateJson: share.estimateJson, expiresAt: share.expiresAt } : null;
}

const sameHash = (a: string, b: string) =>
  a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/**
 * Revokes a link with the key handed out beside it, and drops the stored estimate. False when
 * the link is unknown, already gone or the key does not match.
 */
export async function revokeGccShare(
  token: string,
  revokeKey: string,
  ip: string,
  now = new Date(),
): Promise<boolean> {
  await enforceLimit(shareReadLimiter, ip, 'share link lookups');
  if (!SECRET_PATTERN.test(token) || !SECRET_PATTERN.test(revokeKey)) {
    return false;
  }
  const share = await GccShareModel.findOne(liveFilter(token, now)).select('revokeKeyHash').lean();
  if (!share || !sameHash(share.revokeKeyHash, hashShareToken(revokeKey))) {
    return false;
  }
  await GccShareModel.updateOne({ _id: share._id }, { revokedAt: now, estimateJson: '' });
  return true;
}

import { createHash, randomBytes } from 'node:crypto';
import { StatusSubscriberModel } from './status-subscriber.model';
import { emailer } from '../email';
import { badRequest } from '../../utils/errors';
import { createRateLimiter } from '../../utils/rateLimit';
import { logger } from '../../utils/logger';
import { env } from '../../config/env';

/** Templates the two subscriber emails are authored under, in Tech → Email. */
export const SUBSCRIBE_CONFIRM_TEMPLATE = 'status-subscribe-confirm';
export const INCIDENT_NOTICE_TEMPLATE = 'status-incident-notice';

const HOUR_MS = 60 * 60 * 1000;
const MAX_SIGNUPS_PER_HOUR = 3;
/** How many notices go out at once. Enough to be quick, small enough not to flood SMTP. */
const FANOUT_CHUNK = 25;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const BAD_TOKEN = 'This link is invalid or has already been used.';

/** Per-address, so one stuck form cannot flood one inbox — and cannot probe the rest. */
export const subscribeLimiter = createRateLimiter(HOUR_MS, MAX_SIGNUPS_PER_HOUR);

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * The status site the emailed links open. Only an origin CORS already trusts is honoured:
 * the header is caller-supplied, and a spoofed one would mail a live token to somebody
 * else's domain. Anything else goes to the platform's own status host.
 */
export function statusSiteOrigin(origin?: string): string {
  if (origin && env.corsOrigins.includes(origin)) {
    return origin;
  }
  return `https://status.${env.status.domain}`;
}

/** A fresh unsubscribe token for one subscriber, stored hashed and returned in the clear. */
async function rotateUnsubscribeToken(id: unknown): Promise<string> {
  const token = randomBytes(24).toString('hex');
  await StatusSubscriberModel.updateOne({ _id: id }, { unsubscribeTokenHash: hashToken(token) });
  return token;
}

/**
 * Starts a subscription. Always resolves true — a different answer for an address that is
 * already subscribed would tell a stranger who follows our status page. The email itself
 * is best-effort: a failed send is logged, and the caller sees the same answer either way.
 */
export async function subscribeToStatus(email: string, origin?: string): Promise<boolean> {
  const address = email.trim().toLowerCase();
  if (!EMAIL_PATTERN.exec(address)) {
    return true;
  }
  if (!subscribeLimiter.allow(address)) {
    logger.warn(`Status subscription for ${address} rate-limited`);
    return true;
  }

  const existing = await StatusSubscriberModel.findOne({ email: address }).lean();
  if (existing?.confirmedAt) {
    return true;
  }

  const token = randomBytes(24).toString('hex');
  const saved = await StatusSubscriberModel.findOneAndUpdate(
    { email: address },
    { email: address, tokenHash: hashToken(token) },
    { new: true, upsert: true },
  );
  const site = statusSiteOrigin(origin);
  const unsubscribeToken = await rotateUnsubscribeToken(saved._id);

  try {
    await emailer.send({
      template: SUBSCRIBE_CONFIRM_TEMPLATE,
      to: address,
      variables: {
        confirmUrl: `${site}/subscribe/confirm?token=${token}`,
        unsubscribeUrl: `${site}/unsubscribe?token=${unsubscribeToken}`,
      },
      triggeredBy: 'status page subscription',
    });
  } catch (error) {
    logger.error({ err: error }, `Status confirmation email to ${address} failed`);
  }
  return true;
}

/**
 * Turns a confirm link into a live subscription. Single-use: the token is cleared, so a
 * replayed link is refused rather than quietly re-confirming an address somebody has
 * since unsubscribed.
 */
export async function confirmStatusSubscription(token: string): Promise<boolean> {
  const row = await StatusSubscriberModel.findOne({ tokenHash: hashToken(token) });
  if (!row || !row.tokenHash) {
    badRequest(BAD_TOKEN);
  }
  row.confirmedAt = new Date();
  row.tokenHash = '';
  await row.save();
  return true;
}

/**
 * Removes a subscription. Idempotent, and never an error: somebody clicking "unsubscribe"
 * a second time wants to be gone, and showing them a failure suggests they are not.
 */
export async function unsubscribeFromStatus(token: string): Promise<boolean> {
  await StatusSubscriberModel.deleteOne({ unsubscribeTokenHash: hashToken(token) });
  return true;
}

/** What one notice says. The template turns it into the email people actually read. */
export interface StatusNotice {
  /** The subject line too — the template's subject is `{{headline}}`. */
  headline: string;
  detail: string;
  /** The service or window the notice is about, as a reader would name it. */
  serviceName: string;
  url: string;
}

/** Splits a list into fixed-size chunks, so one fan-out is a handful of sends at a time. */
function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

/** One notice to one subscriber, with an unsubscribe link that works in this very email. */
async function sendNotice(
  subscriber: { _id: unknown; email: string },
  notice: StatusNotice,
  site: string,
): Promise<void> {
  const token = await rotateUnsubscribeToken(subscriber._id);
  await emailer.send({
    template: INCIDENT_NOTICE_TEMPLATE,
    to: subscriber.email,
    variables: {
      headline: notice.headline,
      detail: notice.detail,
      serviceName: notice.serviceName,
      url: notice.url,
      statusUrl: site,
      unsubscribeUrl: `${site}/unsubscribe?token=${token}`,
    },
    triggeredBy: 'status page notice',
  });
}

/**
 * Tells every confirmed subscriber what happened. Best-effort and chunked: one bad
 * address must not stop the rest, and the caller — a probe loop or an incident update —
 * has work of its own that must not fail because an SMTP host is slow.
 */
export async function notifyStatusSubscribers(notice: StatusNotice): Promise<number> {
  const subscribers = await StatusSubscriberModel.find({ confirmedAt: { $ne: null } })
    .select('email')
    .lean();
  if (subscribers.length === 0) {
    return 0;
  }
  const site = statusSiteOrigin();
  let sent = 0;

  for (const batch of chunk(subscribers, FANOUT_CHUNK)) {
    const results = await Promise.allSettled(
      batch.map((subscriber) => sendNotice(subscriber, notice, site)),
    );
    for (const result of results) {
      if (result.status === 'rejected') {
        logger.error({ err: result.reason }, 'Status notice to a subscriber failed');
      } else {
        sent += 1;
      }
    }
  }
  logger.info(
    `Status notice "${notice.headline}" sent to ${sent}/${subscribers.length} subscribers`,
  );
  return sent;
}

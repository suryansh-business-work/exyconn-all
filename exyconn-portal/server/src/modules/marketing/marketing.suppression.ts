import { createHash, randomBytes } from 'node:crypto';
import { MarketingSuppressionModel, type SuppressionReason } from './suppression.model';
import { MarketingUnsubscribeTokenModel } from './unsubscribe-token.model';
import { ContactModel } from '../crm/contact.model';
import { badRequest } from '../../utils/errors';
import { createRateLimiter } from '../../utils/rateLimit';
import { logger } from '../../utils/logger';

const HOUR_MS = 60 * 60 * 1000;
const MAX_UNSUBSCRIBES_PER_HOUR = 30;
const INVALID_LINK = 'This unsubscribe link is not valid. Use the link from a recent email.';

/** Contact statuses that mean the person must not be marketed to, and why. */
const WITHDRAWN_CONSENT: Readonly<Record<string, SuppressionReason>> = {
  UNSUBSCRIBED: 'UNSUBSCRIBED',
  BOUNCED: 'BOUNCED',
};

/** Per-caller, so the one mutation anybody on the internet can call cannot be hammered. */
export const unsubscribeLimiter = createRateLimiter(HOUR_MS, MAX_UNSUBSCRIBES_PER_HOUR);

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

const normalize = (email: string): string => email.trim().toLowerCase();

/** The reason a contact's own status suppresses them, or undefined if it does not. */
export function withdrawnConsentReason(status: string): SuppressionReason | undefined {
  return WITHDRAWN_CONSENT[status];
}

/**
 * Adds an address to the suppression list, or leaves the existing row alone.
 *
 * Idempotent on purpose: an unsubscribe link is clicked twice, forwarded, and prefetched
 * by mail clients, and none of that should be an error the person has to read.
 */
export async function suppress(
  email: string,
  reason: SuppressionReason,
  source: string,
): Promise<void> {
  await MarketingSuppressionModel.updateOne(
    { email: normalize(email) },
    { $setOnInsert: { email: normalize(email), reason, source } },
    { upsert: true },
  );
}

/** Every suppressed address out of the ones asked about, lower-cased. One query per send. */
export async function suppressedAmong(emails: readonly string[]): Promise<Set<string>> {
  if (emails.length === 0) {
    return new Set();
  }
  const rows = await MarketingSuppressionModel.find({ email: { $in: emails.map(normalize) } })
    .select('email')
    .lean<{ email: string }[]>();
  return new Set(rows.map((row) => row.email));
}

/**
 * Mints one unsubscribe link per address, in a single write.
 *
 * The tokens have to exist before the first email goes out, because the link is part of
 * the body — so this runs once for the whole audience rather than once per recipient.
 */
export async function issueUnsubscribeTokens(
  emails: readonly string[],
  campaignId: string,
): Promise<Map<string, string>> {
  const issued = new Map<string, string>();
  const rows = emails.map((email) => {
    const token = randomBytes(24).toString('hex');
    issued.set(normalize(email), token);
    return { tokenHash: hashToken(token), email: normalize(email), campaignId };
  });
  if (rows.length > 0) {
    await MarketingUnsubscribeTokenModel.insertMany(rows);
  }
  return issued;
}

/**
 * Honours an unsubscribe link. Public and unauthenticated: the person clicking it is a
 * recipient, not a portal user, and making them sign in to leave would be the whole
 * problem. The token proves which address is asking.
 */
export async function unsubscribeByToken(token: string, caller: string): Promise<boolean> {
  if (!unsubscribeLimiter.allow(caller)) {
    logger.warn(`Unsubscribe from ${caller} rate-limited`);
    badRequest('Too many attempts. Try again shortly.');
  }
  const row = await MarketingUnsubscribeTokenModel.findOne({ tokenHash: hashToken(token) }).lean();
  if (!row) {
    badRequest(INVALID_LINK);
  }
  await suppress(row.email, 'UNSUBSCRIBED', `campaign:${row.campaignId}`);
  // The CRM is where a salesperson looks before writing to somebody, so the answer has to
  // be visible there too — not only inside the marketing module's own list.
  await ContactModel.updateMany({ email: row.email }, { status: 'UNSUBSCRIBED' });
  logger.info(`Unsubscribed ${row.email} from marketing`);
  return true;
}

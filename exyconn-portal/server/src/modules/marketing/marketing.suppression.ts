import { createHash, randomBytes } from 'node:crypto';
import {
  MarketingSuppressionModel,
  type SuppressionOrigin,
  type SuppressionReason,
} from './suppression.model';
import { MarketingUnsubscribeTokenModel } from './unsubscribe-token.model';
import { createLimiter } from '../../lib/rateLimiter';
import { recordSystemAudit } from '../audit';

/** The audit log's module name for suppression rows — also what the CRUD resolvers log under. */
export const SUPPRESSION_AUDIT_MODULE = 'MarketingSuppression';

const HOUR_SEC = 60 * 60;
const DUPLICATE_KEY = 11000;
const MAX_UNSUBSCRIBES_PER_HOUR = 30;

/** Contact statuses that mean the person must not be marketed to, and why. */
const WITHDRAWN_CONSENT: Readonly<Record<string, SuppressionReason>> = {
  UNSUBSCRIBED: 'UNSUBSCRIBED',
  BOUNCED: 'BOUNCED',
};

/** Per-caller, so the one mutation anybody on the internet can call cannot be hammered. */
export const unsubscribeLimiter = createLimiter({
  keyPrefix: 'unsubscribe_ip',
  points: MAX_UNSUBSCRIBES_PER_HOUR,
  durationSec: HOUR_SEC,
});

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
  origin: SuppressionOrigin,
): Promise<void> {
  await suppressMany([email], reason, source, origin);
}

/** How many upserts are in flight at once when many addresses are suppressed together. */
const UPSERT_BATCH = 25;

/**
 * Suppresses one address unless it already is, and says whether this call added it. An
 * address already listed keeps its first reason and origin; two racing calls end in one row.
 *
 * Per-address `updateOne`, not `bulkWrite`: the tenant scope hooks queries, and a bulk write
 * would insert rows outside the organization, invisible to every scoped read.
 */
async function suppressOne(
  email: string,
  fields: { reason: SuppressionReason; source: string; origin: SuppressionOrigin },
): Promise<unknown> {
  try {
    const result = await MarketingSuppressionModel.updateOne(
      { email },
      { $setOnInsert: { email, ...fields, addedByName: 'System' } },
      { upsert: true },
    );
    return result.upsertedId ?? null;
  } catch (err) {
    if (isDuplicateKeyOnly(err)) {
      return null;
    }
    throw err;
  }
}

/**
 * The same for many addresses — the CRM withdrawals a send finds, say. Each new row gets an
 * append-only audit line; addresses already listed are left exactly as they were.
 */
export async function suppressMany(
  emails: readonly string[],
  reason: SuppressionReason,
  source: string,
  origin: SuppressionOrigin,
): Promise<void> {
  const unique = [...new Set(emails.map(normalize))];
  for (let start = 0; start < unique.length; start += UPSERT_BATCH) {
    const batch = unique.slice(start, start + UPSERT_BATCH);
    const added = await Promise.all(
      batch.map(async (email) => ({
        email,
        id: await suppressOne(email, { reason, source, origin }),
      })),
    );
    await Promise.all(
      added
        .filter((row) => row.id !== null)
        .map((row) =>
          recordSystemAudit({
            action: 'CREATE',
            module: SUPPRESSION_AUDIT_MODULE,
            entityId: row.id,
            entityLabel: row.email,
            summary: `Suppressed: ${reason} (${origin})`,
          }),
        ),
    );
  }
}

/** Whether a write failed only because the rows it wanted to insert already exist. */
export function isDuplicateKeyOnly(err: unknown): boolean {
  const error = err as { code?: number; writeErrors?: { code?: number }[] };
  if (error.writeErrors?.length) {
    return error.writeErrors.every((writeError) => writeError.code === DUPLICATE_KEY);
  }
  return error.code === DUPLICATE_KEY;
}

/** Every suppressed address out of the ones asked about, lower-cased, with why. One query. */
export async function suppressionsAmong(
  emails: readonly string[],
): Promise<Map<string, SuppressionReason>> {
  if (emails.length === 0) {
    return new Map();
  }
  const rows = await MarketingSuppressionModel.find({ email: { $in: emails.map(normalize) } })
    .select('email reason')
    .lean<{ email: string; reason: SuppressionReason }[]>();
  return new Map(rows.map((row) => [row.email, row.reason]));
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

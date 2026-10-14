import { badRequest } from '../../utils/errors';
import { isEmailAddress } from '../../utils/emailAddress';
import { logger } from '../../utils/logger';
import { tableQuery, type TableConfig, type TableQueryInput } from '../../utils/tableQuery';
import {
  EmailVerificationBatchModel,
  EmailVerificationModel,
  type VerificationSource,
  type VerificationStatus,
} from './email-verification.model';
import { EmailVerifierConfigModel } from './email-verifier-config.model';
import { checkWithReacher, type CheckResult, type ReacherProxy } from './reacher.client';

/** A CSV is checked in the background; past this many addresses it is split into several. */
export const MAX_BATCH_EMAILS = 5000;

/** Addresses one background pass checks per company, and how many at the same time. */
const PASS_SIZE = 12;
const PARALLEL = 3;

const RECORD_TABLE: TableConfig = {
  searchFields: ['email', 'reason', 'checkedBy'],
  filterFields: ['email', 'status', 'source', 'checkedBy'],
  sortFields: ['email', 'status', 'source', 'checkedAt'],
  defaultSort: { field: 'checkedAt', dir: 'DESC' },
};

/** One address as stored: trimmed and lower-cased. */
export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

/** The proxy checks go through, from the active config; none when it is not set. */
async function activeProxy(): Promise<ReacherProxy | null> {
  const config = await EmailVerifierConfigModel.findOne({ isActive: true }).lean();
  if (!config?.proxyHost) {
    return null;
  }
  return {
    host: config.proxyHost,
    port: config.proxyPort,
    ...(config.proxyUsername ? { username: config.proxyUsername } : {}),
    ...(config.proxyPassword ? { password: config.proxyPassword } : {}),
  };
}

/** A check that never reaches Reacher: the address is not an email address at all. */
const NOT_AN_EMAIL: CheckResult = {
  status: 'INVALID',
  reason: 'Not a valid email address',
  syntaxValid: false,
  hasMx: false,
  deliverable: false,
  catchAll: false,
  disposable: false,
  roleAccount: false,
  suggestion: '',
};

interface Checked {
  source: VerificationSource;
  checkedBy: string;
  batchId?: string;
}

async function store(email: string, result: CheckResult, checked: Checked) {
  return EmailVerificationModel.findOneAndUpdate(
    { email },
    { ...result, ...checked, batchId: checked.batchId ?? '', email, checkedAt: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
}

/** Checks one address now and keeps the result. Throws when the verifier cannot be reached. */
export async function verifyEmail(rawEmail: string, checked: Checked) {
  const email = normalizeEmail(rawEmail);
  if (!isEmailAddress(email)) {
    return store(email, NOT_AN_EMAIL, checked);
  }
  let result: CheckResult;
  try {
    result = await checkWithReacher(email, await activeProxy());
  } catch (error) {
    logger.warn({ error }, 'Email verifier unreachable');
    badRequest('The email verifier is not available right now. Try again in a minute.');
  }
  return store(email, result, checked);
}

/** The stored result for each of these addresses (absent ones were never checked). */
export async function verificationsFor(emails: string[]) {
  const wanted = [...new Set(emails.map(normalizeEmail).filter(Boolean))];
  if (wanted.length === 0) {
    return new Map<string, Awaited<ReturnType<typeof verifyEmail>>>();
  }
  const rows = await EmailVerificationModel.find({ email: { $in: wanted } }).lean();
  return new Map(rows.map((row) => [row.email, row]));
}

/** One page of stored results, for the verifier's Records grid. */
export const listVerifications = (input: TableQueryInput) =>
  tableQuery(EmailVerificationModel, input, RECORD_TABLE);

/** Queues a bulk check of the addresses found in an uploaded CSV. */
export async function createBatch(name: string, rawEmails: string[], createdBy: string) {
  const emails = [...new Set(rawEmails.map(normalizeEmail).filter(Boolean))];
  if (emails.length === 0) {
    badRequest('The file has no email addresses.');
  }
  if (emails.length > MAX_BATCH_EMAILS) {
    badRequest(`A file can hold up to ${MAX_BATCH_EMAILS} addresses; split it and upload again.`);
  }
  const batch = await EmailVerificationBatchModel.create({ name, emails, createdBy });
  return batch.toObject();
}

/** The 50 most recent bulk checks, each with its size but without its (long) address list. */
export const listBatches = () =>
  EmailVerificationBatchModel.aggregate<{ _id: unknown; total: number }>([
    { $sort: { createdAt: -1 } },
    { $limit: 50 },
    { $addFields: { total: { $size: '$emails' } } },
    { $project: { emails: 0 } },
  ]);

const COUNT_FIELD: Record<VerificationStatus, 'verified' | 'risky' | 'invalid' | 'unknown'> = {
  VERIFIED: 'verified',
  RISKY: 'risky',
  INVALID: 'invalid',
  UNKNOWN: 'unknown',
};

/** One address of a bulk check; a verifier failure counts it as unknown rather than stopping. */
async function checkInBatch(
  email: string,
  batchId: string,
  checkedBy: string,
  proxy: ReacherProxy | null,
) {
  let result: CheckResult = NOT_AN_EMAIL;
  if (isEmailAddress(email)) {
    try {
      result = await checkWithReacher(email, proxy);
    } catch (error) {
      logger.warn({ error }, 'Email verifier unreachable during a bulk check');
      result = {
        ...NOT_AN_EMAIL,
        status: 'UNKNOWN',
        reason: 'The verifier could not be reached',
        syntaxValid: true,
      };
    }
  }
  await store(email, result, { source: 'BULK', checkedBy, batchId });
  return result.status;
}

/**
 * One background pass for the company in scope: the oldest unfinished bulk check moves on by a
 * few addresses. `processed` only advances after its addresses are stored, so a restart picks up
 * where the last pass got to.
 */
export async function runBatchPass(): Promise<number> {
  const batch = await EmailVerificationBatchModel.findOne({
    status: { $in: ['QUEUED', 'RUNNING'] },
  })
    .sort({ createdAt: 1 })
    .lean();
  if (!batch) {
    return 0;
  }
  const next = batch.emails.slice(batch.processed, batch.processed + PASS_SIZE);
  const proxy = await activeProxy();
  const counts = { verified: 0, risky: 0, invalid: 0, unknown: 0 };
  for (let at = 0; at < next.length; at += PARALLEL) {
    const statuses = await Promise.all(
      next
        .slice(at, at + PARALLEL)
        .map((email) => checkInBatch(email, String(batch._id), batch.createdBy, proxy)),
    );
    statuses.forEach((status) => {
      counts[COUNT_FIELD[status]] += 1;
    });
  }
  const processed = batch.processed + next.length;
  const finished = processed >= batch.emails.length;
  await EmailVerificationBatchModel.updateOne(
    { _id: batch._id },
    {
      $inc: counts,
      $set: {
        processed,
        status: finished ? 'DONE' : 'RUNNING',
        ...(finished ? { finishedAt: new Date() } : {}),
      },
    },
  );
  return next.length;
}

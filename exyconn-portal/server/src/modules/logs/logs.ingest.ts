import { createHash } from 'node:crypto';
import { isValidObjectId } from 'mongoose';
import { AppLogGroupModel } from './app-log-group.model';
import { AppLogEventModel } from './app-log-event.model';
import {
  FIELD_LIMITS,
  INGEST_MAX_BATCHES,
  INGEST_WINDOW_MS,
  MAX_BREADCRUMBS,
  MAX_ENTRIES_PER_BATCH,
  SERVER_ERROR_WRITES_PER_MINUTE,
  type AppLogLevel,
  type AppLogSource,
} from './logs.constants';
import { UserModel } from '../admin/user.model';
import { badRequest } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { createRateLimiter } from '../../utils/rateLimit';
import type { TokenPayload } from '../../utils/jwt';

export interface LogBreadcrumbInput {
  at: Date;
  level: AppLogLevel;
  message: string;
}

export interface LogEntryInput {
  level: AppLogLevel;
  message: string;
  errorName?: string | null;
  stack?: string | null;
  componentStack?: string | null;
  route?: string | null;
  context?: string | null;
  count?: number | null;
  occurredAt: Date;
  breadcrumbs?: LogBreadcrumbInput[] | null;
}

export interface LogBatchInput {
  source: AppLogSource;
  app: string;
  appVersion?: string | null;
  platform?: string | null;
  osVersion?: string | null;
  deviceModel?: string | null;
  deviceId?: string | null;
  sessionId?: string | null;
  user?: { id: string; name: string; email: string } | null;
  entries: LogEntryInput[];
}

/** Who sent the batch, as the request (not the body) says. */
export interface LogRequest {
  user: TokenPayload | null;
  ip?: string;
  userAgent?: string;
}

interface ResolvedUser {
  id: string;
  name: string;
  email: string;
  verified: boolean;
}

/** One entry can stand for this many identical ones; anything above is a client bug. */
const MAX_FOLDED_COUNT = 100_000;

const limiter = createRateLimiter(INGEST_WINDOW_MS, INGEST_MAX_BATCHES);

const MINUTE_MS = 60_000;

/**
 * A process-wide budget that refills continuously up to `capacity` per minute. Unlike the
 * per-caller window above it has no key: it bounds the total, whoever is causing it.
 */
function createTokenBucket(capacity: number) {
  let tokens = capacity;
  let updatedAt = Date.now();
  return {
    take(): boolean {
      const now = Date.now();
      tokens = Math.min(capacity, tokens + ((now - updatedAt) * capacity) / MINUTE_MS);
      updatedAt = now;
      if (tokens < 1) {
        return false;
      }
      tokens -= 1;
      return true;
    },
    reset(): void {
      tokens = capacity;
      updatedAt = Date.now();
    },
  };
}

const serverWriteBudget = createTokenBucket(SERVER_ERROR_WRITES_PER_MINUTE);
/** When the dropped-writes warning last went out, so a flood is reported once a minute. */
let budgetWarnedAt = 0;

/** Test seam: forgets every recorded batch and refills the server error budget. */
export function resetLogIngestLimits(): void {
  limiter.reset();
  serverWriteBudget.reset();
  budgetWarnedAt = 0;
}

function cut(value: string | null | undefined, max: number): string {
  return (value ?? '').trim().slice(0, max);
}

/**
 * The message with the parts that differ between occurrences of the same bug (ids, numbers)
 * replaced, so "Order 41 not found" and "Order 42 not found" are one group.
 */
export function normalizeMessage(message: string): string {
  return message
    .replaceAll(/[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}/gi, '<uuid>')
    .replaceAll(/\b[\da-f]{24}\b/gi, '<id>')
    .replaceAll(/\d+/g, '<n>');
}

export function fingerprintOf(
  source: AppLogSource,
  app: string,
  level: AppLogLevel,
  errorName: string,
  message: string,
): string {
  const key = [source, app, level, errorName, normalizeMessage(message)].join('|');
  return createHash('sha1').update(key).digest('hex');
}

/** The session's user when there is one (verified), else whoever the client last knew. */
async function resolveUser(
  req: LogRequest,
  claimed: LogBatchInput['user'],
): Promise<ResolvedUser | null> {
  if (req.user) {
    const row = isValidObjectId(req.user.id)
      ? await UserModel.findById(req.user.id).select('name email').lean()
      : null;
    const email = row?.email ?? req.user.email;
    return { id: req.user.id, name: row?.name ?? '', email, verified: true };
  }
  if (claimed?.id) {
    return {
      id: cut(claimed.id, FIELD_LIMITS.short),
      name: cut(claimed.name, FIELD_LIMITS.short),
      email: cut(claimed.email, FIELD_LIMITS.short),
      verified: false,
    };
  }
  return null;
}

/** Wraps a client string so a leading `$` is never read as a field path by the pipeline. */
const literal = (value: unknown) => ({ $literal: value });

/** An entry's text fields cut to their limits, shared by the group and the occurrence. */
interface CleanEntry {
  level: AppLogLevel;
  errorName: string;
  message: string;
  stack: string;
  route: string;
  count: number;
  at: Date;
}

function clean(entry: LogEntryInput): CleanEntry {
  return {
    level: entry.level,
    errorName: cut(entry.errorName, FIELD_LIMITS.short),
    message: cut(entry.message, FIELD_LIMITS.message) || '(no message)',
    stack: cut(entry.stack, FIELD_LIMITS.stack),
    route: cut(entry.route, FIELD_LIMITS.short),
    count: Math.min(Math.max(entry.count ?? 1, 1), MAX_FOLDED_COUNT),
    at: entry.occurredAt,
  };
}

/**
 * Folds one occurrence into its group with a single upsert. A RESOLVED group that happens
 * again is re-opened (a regression); an IGNORED one stays ignored but keeps counting.
 */
async function upsertGroup(batch: LogBatchInput, entry: CleanEntry, user: ResolvedUser | null) {
  const app = cut(batch.app, FIELD_LIMITS.short);
  const { at } = entry;
  const userFields = user
    ? {
        lastUserName: literal(user.name),
        lastUserEmail: literal(user.email),
        userIds: { $setUnion: [{ $ifNull: ['$userIds', []] }, [literal(user.id)]] },
      }
    : {
        // A pipeline upsert skips schema defaults, so a group first seen without a user
        // would otherwise have no name or email at all — and the grid's non-null fields fail.
        lastUserName: { $ifNull: ['$lastUserName', ''] },
        lastUserEmail: { $ifNull: ['$lastUserEmail', ''] },
        userIds: { $ifNull: ['$userIds', []] },
      };
  const ignored = { $eq: ['$status', 'IGNORED'] };

  return AppLogGroupModel.findOneAndUpdate(
    { fingerprint: fingerprintOf(batch.source, app, entry.level, entry.errorName, entry.message) },
    [
      {
        $set: {
          source: literal(batch.source),
          app: literal(app),
          level: literal(entry.level),
          errorName: literal(entry.errorName),
          message: literal(entry.message),
          stack: literal(entry.stack),
          route: literal(entry.route),
          platform: literal(cut(batch.platform, FIELD_LIMITS.short)),
          appVersion: literal(cut(batch.appVersion, FIELD_LIMITS.short)),
          count: { $add: [{ $ifNull: ['$count', 0] }, entry.count] },
          firstSeenAt: { $min: [{ $ifNull: ['$firstSeenAt', at] }, at] },
          lastSeenAt: { $max: [{ $ifNull: ['$lastSeenAt', at] }, at] },
          status: { $cond: [ignored, 'IGNORED', 'OPEN'] },
          resolvedAt: { $cond: [ignored, '$resolvedAt', null] },
          ...userFields,
        },
      },
      { $set: { userCount: { $size: '$userIds' } } },
    ],
    { upsert: true, new: true, lean: true },
  );
}

function breadcrumbsOf(entry: LogEntryInput): LogBreadcrumbInput[] {
  return (entry.breadcrumbs ?? []).slice(-MAX_BREADCRUMBS).map((crumb) => ({
    at: crumb.at,
    level: crumb.level,
    message: cut(crumb.message, FIELD_LIMITS.breadcrumb),
  }));
}

async function recordEntry(
  batch: LogBatchInput,
  entry: LogEntryInput,
  user: ResolvedUser | null,
  req: LogRequest,
): Promise<void> {
  const cleaned = clean(entry);
  // `upsert` with `new` always answers with the document.
  const group = (await upsertGroup(batch, cleaned, user))!;
  await AppLogEventModel.create({
    groupId: group._id,
    level: cleaned.level,
    message: cleaned.message,
    stack: cleaned.stack,
    componentStack: cut(entry.componentStack, FIELD_LIMITS.componentStack),
    route: cleaned.route,
    context: cut(entry.context, FIELD_LIMITS.context),
    breadcrumbs: breadcrumbsOf(entry),
    count: cleaned.count,
    occurredAt: cleaned.at,
    userId: user?.id ?? '',
    userName: user?.name ?? '',
    userEmail: user?.email ?? '',
    userVerified: user?.verified ?? false,
    deviceId: cut(batch.deviceId, FIELD_LIMITS.short),
    platform: cut(batch.platform, FIELD_LIMITS.short),
    osVersion: cut(batch.osVersion, FIELD_LIMITS.short),
    deviceModel: cut(batch.deviceModel, FIELD_LIMITS.short),
    appVersion: cut(batch.appVersion, FIELD_LIMITS.short),
    sessionId: cut(batch.sessionId, FIELD_LIMITS.short),
    userAgent: cut(req.userAgent, FIELD_LIMITS.short),
    ip: req.ip ?? '',
  });
}

/**
 * Stores one batch of client logs. Returns false — and stores nothing — when the caller is
 * over its rate limit: the client then drops the batch instead of retrying it into the wall.
 */
export async function ingestLogBatch(batch: LogBatchInput, req: LogRequest): Promise<boolean> {
  if (batch.entries.length > MAX_ENTRIES_PER_BATCH) {
    badRequest(`At most ${MAX_ENTRIES_PER_BATCH} log entries per call`);
  }
  const caller = req.user?.id ?? req.ip ?? 'unknown';
  if (!limiter.allow(caller)) {
    logger.warn({ caller, app: batch.app }, 'Client log batch rate-limited');
    return false;
  }
  const user = await resolveUser(req, batch.user);
  // In order, so two entries of one new group never race each other's upsert.
  for (const entry of batch.entries) {
    await recordEntry(batch, entry, user, req);
  }
  return true;
}

/**
 * Gives every group stored before the upsert wrote them an empty last user, so the grid can
 * list those rows. Runs at boot; a no-op once no such group is left.
 */
export async function backfillAppLogGroupUsers(): Promise<void> {
  for (const field of ['lastUserName', 'lastUserEmail']) {
    await AppLogGroupModel.updateMany({ [field]: { $exists: false } }, { $set: { [field]: '' } });
  }
}

/** How the API names itself in its own logs. */
const SERVER_APP = 'portal-server';

/** The entries the process-wide write budget still has room for; warns when it drops any. */
function withinWriteBudget(entries: LogEntryInput[]): LogEntryInput[] {
  const allowed: LogEntryInput[] = [];
  for (const entry of entries) {
    if (serverWriteBudget.take()) {
      allowed.push(entry);
    }
  }
  const dropped = entries.length - allowed.length;
  const now = Date.now();
  if (dropped > 0 && now - budgetWarnedAt >= MINUTE_MS) {
    budgetWarnedAt = now;
    logger.warn({ dropped }, 'Server error log writes are over budget; dropping the Mongo copy');
  }
  return allowed;
}

/**
 * Stores errors the API itself threw (see logs.plugin.ts). Never throws: it is the server
 * reporting on itself, and a failure here must not turn one error into two. Bounded by a
 * process-wide budget (SERVER_ERROR_WRITES_PER_MINUTE) rather than per caller.
 */
export async function recordServerErrors(entries: LogEntryInput[], req: LogRequest): Promise<void> {
  const allowed = withinWriteBudget(entries);
  if (allowed.length === 0) {
    return;
  }
  const batch: LogBatchInput = {
    source: 'SERVER',
    app: SERVER_APP,
    platform: `node ${process.version}`,
    entries: allowed,
  };
  try {
    const user = await resolveUser(req, null);
    for (const entry of allowed) {
      await recordEntry(batch, entry, user, req);
    }
  } catch (error) {
    logger.error({ err: error }, 'Could not store a server error log');
  }
}

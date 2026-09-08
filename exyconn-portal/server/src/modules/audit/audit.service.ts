import { isValidObjectId } from 'mongoose';
import { AuditLogModel, type AuditAction } from './audit.model';
import { UserModel } from '../admin/user.model';
import { logger } from '../../utils/logger';
import {
  tableQuery,
  tableStats,
  type StatsConfig,
  type TableConfig,
  type TableQueryInput,
} from '../../utils/tableQuery';
import type { GraphQLContext } from '../../middleware/auth';

/** Whitelist of the columns the Audit Log grid may search / filter / sort. */
const AUDIT_TABLE_CONFIG: TableConfig = {
  searchFields: ['actorName', 'actorEmail', 'entityLabel', 'summary'],
  filterFields: ['action', 'module', 'actorId'],
  sortFields: ['createdAt', 'action', 'module', 'actorName'],
  defaultSort: { field: 'createdAt', dir: 'DESC' },
};

const AUDIT_STATS_CONFIG: StatsConfig = { countBy: ['action', 'module'] };

/** In order of preference, the field that names a row to a human. */
const LABEL_FIELDS = ['name', 'number', 'title', 'subject', 'email', 'key', 'label'];

/** Never diffed: a hash in the log is a hash leaked. */
const SECRET_FIELDS = new Set(['password', 'passwordHash', 'tokenHash']);

/** Bookkeeping keys that always differ between a stored document and an input. */
const IGNORED_FIELDS = new Set(['_id', 'id', '__v', 'createdAt', 'updatedAt']);

/** A row's `changes` holds at most this many fields — a log entry, not a backup. */
const MAX_DIFF_FIELDS = 8;

export type FieldChange = { from: unknown; to: unknown };
export type AuditChanges = Record<string, FieldChange>;

export interface AuditEntry {
  action: AuditAction;
  module: string;
  entityId?: unknown;
  entityLabel?: string;
  summary: string;
  changes?: AuditChanges;
  /**
   * Who did it, when it is not the signed-in caller: a login has no session yet, and a
   * reset link is used by somebody who cannot sign in.
   */
  actor?: Actor;
}

type Actor = { id: string; name?: string; email?: string };

/** A human name for a document — whichever of the usual naming fields it has. */
export function entityLabelOf(doc: unknown): string {
  if (!doc || typeof doc !== 'object') {
    return '';
  }
  const record = doc as Record<string, unknown>;
  for (const field of LABEL_FIELDS) {
    const value = record[field];
    if (typeof value === 'string' && value.trim() !== '') {
      return value;
    }
  }
  return '';
}

/** Turns Mongo values into something JSON can hold and compare. */
function normalize(value: unknown): unknown {
  if (value === undefined || value === null) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(normalize);
  }
  if (typeof value === 'object') {
    const candidate = value as { toHexString?: () => string };
    if (typeof candidate.toHexString === 'function') {
      return candidate.toHexString();
    }
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, normalize(v)]),
    );
  }
  return value;
}

/**
 * The fields of `input` whose value differs from `before`, capped so a bulk edit does not
 * write a document-sized row. Secrets are never included, even when they changed.
 */
export function diffChanges(before: unknown, input: object): AuditChanges {
  const previous = (before ?? {}) as Record<string, unknown>;
  const changes: AuditChanges = {};
  for (const [field, raw] of Object.entries(input)) {
    if (Object.keys(changes).length >= MAX_DIFF_FIELDS) {
      break;
    }
    if (IGNORED_FIELDS.has(field) || SECRET_FIELDS.has(field)) {
      continue;
    }
    const from = normalize(previous[field]);
    const to = normalize(raw);
    if (JSON.stringify(from) !== JSON.stringify(to)) {
      changes[field] = { from, to };
    }
  }
  return changes;
}

async function actorName(id: string): Promise<string> {
  if (!isValidObjectId(id)) {
    return '';
  }
  const user = await UserModel.findById(id).select('name').lean();
  return user?.name ?? '';
}

/**
 * Appends one audit row. Best-effort by design: the change it describes has already
 * happened, and a log that could roll it back — or fail it — would be worse than a
 * missing line. A failure is logged, never thrown.
 */
export async function recordAudit(ctx: GraphQLContext, entry: AuditEntry): Promise<void> {
  try {
    const actor: Actor | null = entry.actor ?? ctx.user;
    const name = actor?.name ?? (actor ? await actorName(actor.id) : '');
    const changes = entry.changes && Object.keys(entry.changes).length > 0 ? entry.changes : null;
    await AuditLogModel.create({
      actorId: actor?.id ?? '',
      actorName: name,
      actorEmail: actor?.email ?? '',
      action: entry.action,
      module: entry.module,
      entityId: entry.entityId === undefined ? '' : String(entry.entityId),
      entityLabel: entry.entityLabel ?? '',
      summary: entry.summary,
      changes: changes ? JSON.stringify(changes) : '',
      ip: ctx.ip ?? '',
    });
  } catch (error) {
    logger.error({ err: error, entry }, 'Audit log write failed');
  }
}

/** One page of the log for the Admin grid. */
export function listAuditLogsPaged(input: TableQueryInput) {
  return tableQuery(AuditLogModel, input, AUDIT_TABLE_CONFIG);
}

/** Per-action and per-module counts for the Admin grid's tiles. */
export function listAuditLogsStats() {
  return tableStats(AuditLogModel, AUDIT_STATS_CONFIG);
}

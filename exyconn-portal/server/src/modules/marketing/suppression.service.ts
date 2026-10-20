import { z } from 'zod';
import { MarketingSuppressionModel } from './suppression.model';
import {
  MAX_SUPPRESSION_NOTE,
  type SuppressionOrigin,
  type SuppressionReason,
} from './suppression.model';
import { isDuplicateKeyOnly } from './marketing.suppression';
import { normalizeEmail } from './audience.eligibility';
import { badRequest, notFound } from '../../utils/errors';
import type { TableConfig } from '../../utils/tableQuery';

/** The suppression grid: what it searches, filters and sorts on. */
export const SUPPRESSION_TABLE: TableConfig = {
  searchFields: ['email', 'note', 'source'],
  filterFields: ['email', 'reason', 'origin', 'scope', 'addedByName', 'createdAt'],
  sortFields: ['email', 'reason', 'origin', 'createdAt', 'addedByName'],
  defaultSort: { field: 'createdAt', dir: 'DESC' },
};

/** A bulk add bigger than this is an import job, not a form. */
export const MAX_BULK_SUPPRESSIONS = 5000;

const isEmail = (value: string): boolean => z.email().safeParse(value).success;

export interface SuppressionActor {
  id: string;
  name: string;
}

export interface NewSuppression {
  email: string;
  reason: SuppressionReason;
  note?: string | null;
  archived?: boolean | null;
}

const noteOf = (note?: string | null): string => {
  const trimmed = (note ?? '').trim();
  if (trimmed.length > MAX_SUPPRESSION_NOTE) {
    badRequest(`Keep the note under ${MAX_SUPPRESSION_NOTE} characters.`);
  }
  return trimmed;
};

const alreadyListed = (email: string, archived: boolean): never =>
  badRequest(
    archived
      ? `${email} is already suppressed (archived). It is still excluded from every campaign.`
      : `${email} is already on the suppression list.`,
  );

/**
 * Adds one address by hand. The origin is the action that wrote it, never a choice; the
 * unique address means a second entry is refused, and two racing submits end in one row.
 */
export async function addSuppression(input: NewSuppression, actor: SuppressionActor) {
  const email = normalizeEmail(input.email);
  if (!isEmail(email)) {
    badRequest('Enter a valid email address.');
  }
  const existing = await MarketingSuppressionModel.findOne({ email })
    .select('archivedAt')
    .lean<{ archivedAt?: Date | null }>();
  if (existing) {
    alreadyListed(email, Boolean(existing.archivedAt));
  }
  try {
    const created = await MarketingSuppressionModel.create({
      email,
      reason: input.reason,
      note: noteOf(input.note),
      origin: 'ADMIN',
      addedById: actor.id,
      addedByName: actor.name,
      archivedAt: input.archived ? new Date() : null,
    });
    return created.toObject();
  } catch (err) {
    if (isDuplicateKeyOnly(err)) {
      return alreadyListed(email, false);
    }
    throw err;
  }
}

export interface BulkSuppressionResult {
  added: string[];
  alreadySuppressed: string[];
  invalid: string[];
}

/**
 * Adds many addresses at once — pasted, or read from a CSV. Already-listed addresses are
 * reported rather than touched: an existing reason and origin are never rewritten.
 */
export async function addSuppressions(
  rawEmails: readonly string[],
  reason: SuppressionReason,
  note: string | null | undefined,
  origin: Extract<SuppressionOrigin, 'ADMIN' | 'IMPORT'>,
  actor: SuppressionActor,
): Promise<BulkSuppressionResult> {
  const unique = [...new Set(rawEmails.map(normalizeEmail).filter(Boolean))];
  if (unique.length > MAX_BULK_SUPPRESSIONS) {
    badRequest(`Add at most ${MAX_BULK_SUPPRESSIONS} addresses at a time.`);
  }
  const invalid = unique.filter((email) => !isEmail(email));
  const valid = unique.filter(isEmail);
  const existing = new Set(
    (
      await MarketingSuppressionModel.find({ email: { $in: valid } })
        .select('email')
        .lean()
    ).map((row) => row.email),
  );
  const fresh = valid.filter((email) => !existing.has(email));
  const cleanNote = noteOf(note);
  try {
    await MarketingSuppressionModel.insertMany(
      fresh.map((email) => ({
        email,
        reason,
        note: cleanNote,
        origin,
        addedById: actor.id,
        addedByName: actor.name,
      })),
      { ordered: false },
    );
  } catch (err) {
    if (!isDuplicateKeyOnly(err)) {
      throw err;
    }
  }
  return { added: fresh, alreadySuppressed: valid.filter((email) => existing.has(email)), invalid };
}

/** Changes only the internal note — the reason and origin record what happened. */
export async function updateSuppressionNote(id: string, note: string) {
  const row = await MarketingSuppressionModel.findByIdAndUpdate(
    id,
    { note: noteOf(note) },
    { new: true, runValidators: true },
  ).lean();
  if (!row) {
    notFound('Suppression');
  }
  return row;
}

/** One suppression row, archived or not, or a 404. */
export async function getSuppression(id: string) {
  const row = await MarketingSuppressionModel.findById(id).lean();
  if (!row) {
    notFound('Suppression');
  }
  return row;
}

export interface SuppressionSummary {
  total: number;
  archived: number;
  unsubscribed: number;
  hardBounced: number;
  addedManually: number;
  updatedAt: Date | null;
}

/**
 * The page's four figures in one aggregation. Each address is one row with one reason, so
 * no address is counted twice within a figure; archived rows count, because they still block.
 */
export async function suppressionSummary(): Promise<SuppressionSummary> {
  const [row] = await MarketingSuppressionModel.aggregate<SuppressionSummary>([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        archived: { $sum: { $cond: [{ $ne: [{ $ifNull: ['$archivedAt', null] }, null] }, 1, 0] } },
        unsubscribed: { $sum: { $cond: [{ $eq: ['$reason', 'UNSUBSCRIBED'] }, 1, 0] } },
        hardBounced: { $sum: { $cond: [{ $eq: ['$reason', 'BOUNCED'] }, 1, 0] } },
        addedManually: {
          $sum: {
            $cond: [{ $in: [{ $ifNull: ['$origin', 'ADMIN'] }, ['ADMIN', 'IMPORT']] }, 1, 0],
          },
        },
        updatedAt: { $max: '$updatedAt' },
      },
    },
  ]);
  return (
    row ?? {
      total: 0,
      archived: 0,
      unsubscribed: 0,
      hardBounced: 0,
      addedManually: 0,
      updatedAt: null,
    }
  );
}

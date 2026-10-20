import { isValidObjectId } from 'mongoose';
import {
  MarketingSuppressionModel,
  CONSENT_REASONS,
  type SuppressionReason,
} from './suppression.model';
import { SUPPRESSION_AUDIT_MODULE } from './marketing.suppression';
import {
  addSuppression,
  addSuppressions,
  getSuppression,
  suppressionSummary,
  updateSuppressionNote,
  SUPPRESSION_TABLE,
  type NewSuppression,
  type SuppressionActor,
} from './suppression.service';
import { addressesOfCrmNamed, crmLinksFor } from './suppression.links';
import { normalizeEmail } from './audience.eligibility';
import { AuditLogModel, recordAudit } from '../audit';
import { UserModel } from '../admin/user.model';
import { assertPermission } from '../../lib/permissions';
import { archiveRecords } from '../../lib/archivable';
import { assertRole } from '../../middleware/roleGuard';
import { escapeRegex, tableQuery, type TableQueryInput } from '../../utils/tableQuery';
import { withId, withIds } from '../../utils/serialize';
import { badRequest } from '../../utils/errors';
import { ROLES } from '../../constants/roles';
import type { GraphQLContext } from '../../middleware/auth';

const MODULE = SUPPRESSION_AUDIT_MODULE;
const MIN_JUSTIFICATION = 10;
const MAX_HISTORY = 100;

type Action = 'VIEW' | 'CREATE' | 'EDIT' | 'DELETE';
const guard = (ctx: GraphQLContext, action: Action) =>
  assertPermission(ctx, MODULE, [ROLES.MARKETING], action);

/** Who is acting, by name, for the row's "Added by". */
async function actorOf(ctx: GraphQLContext): Promise<SuppressionActor> {
  const id = ctx.user?.id ?? '';
  const user = isValidObjectId(id) ? await UserModel.findById(id).select('name').lean() : null;
  return { id, name: user?.name ?? ctx.user?.email ?? '' };
}

/** Rows with the CRM records behind each address, two queries for the whole page. */
async function withLinks(rows: { _id: unknown; email: string }[]) {
  const links = await crmLinksFor(rows.map((row) => row.email));
  return withIds(rows).map((row) => ({ ...row, linkedRecords: links.get(row.email) ?? [] }));
}

/**
 * The search also finds an address through the contact or company that holds it, so
 * "Urban Café" finds info@urbancafe.in. The name match is folded into the base filter.
 */
async function searchFilter(search: string) {
  const text = new RegExp(escapeRegex(search), 'i');
  const crmEmails = await addressesOfCrmNamed(search);
  return {
    $or: [{ email: text }, { note: text }, { source: text }, { email: { $in: crmEmails } }],
  };
}

export const suppressionResolvers = {
  Query: {
    listMarketingSuppressionsPaged: async (
      _p: unknown,
      { input }: { input: TableQueryInput },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'VIEW');
      const search = input.search?.trim() ?? '';
      const base = search ? await searchFilter(search) : {};
      const page = await tableQuery(
        MarketingSuppressionModel,
        { ...input, search: '' },
        SUPPRESSION_TABLE,
        base,
      );
      return {
        rows: await withLinks(page.rows as { _id: unknown; email: string }[]),
        totalCount: page.totalCount,
      };
    },

    marketingSuppressionSummary: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await guard(ctx, 'VIEW');
      return suppressionSummary();
    },

    /** What adding this address would touch: an existing row, and the CRM records holding it. */
    marketingSuppressionLookup: async (
      _p: unknown,
      { email }: { email: string },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'VIEW');
      const address = normalizeEmail(email);
      const [existing, links] = await Promise.all([
        MarketingSuppressionModel.findOne({ email: address }).lean(),
        crmLinksFor([address]),
      ]);
      return {
        email: address,
        existing: existing ? withId(existing) : null,
        linkedRecords: links.get(address) ?? [],
      };
    },

    /** Every recorded change to an address, newest first — kept even after a removal. */
    marketingSuppressionHistory: async (
      _p: unknown,
      { email }: { email: string },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'VIEW');
      const address = normalizeEmail(email);
      // Grid bulk archives are logged by row id alone, so the current row's id is matched too.
      const current = await MarketingSuppressionModel.find({ email: address }).select('_id').lean();
      const rows = await AuditLogModel.find({
        module: MODULE,
        $or: [
          { entityLabel: address },
          { entityId: { $in: current.map((row) => String(row._id)) } },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(MAX_HISTORY)
        .lean();
      return withIds(rows);
    },
  },

  Mutation: {
    createMarketingSuppression: async (
      _p: unknown,
      { input }: { input: NewSuppression },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'CREATE');
      const created = await addSuppression(input, await actorOf(ctx));
      await recordAudit(ctx, {
        action: 'CREATE',
        module: MODULE,
        entityId: created._id,
        entityLabel: created.email,
        summary: `Suppressed: ${created.reason} (ADMIN)`,
      });
      return withId(created);
    },

    addMarketingSuppressions: async (
      _p: unknown,
      {
        input,
      }: {
        input: { emails: string[]; reason: SuppressionReason; note?: string; fromFile?: boolean };
      },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'CREATE');
      const origin = input.fromFile ? 'IMPORT' : 'ADMIN';
      const result = await addSuppressions(
        input.emails,
        input.reason,
        input.note,
        origin,
        await actorOf(ctx),
      );
      await Promise.all(
        result.added.map((email) =>
          recordAudit(ctx, {
            action: input.fromFile ? 'IMPORT' : 'CREATE',
            module: MODULE,
            entityLabel: email,
            summary: `Suppressed: ${input.reason} (${origin})`,
          }),
        ),
      );
      return result;
    },

    updateMarketingSuppressionNote: async (
      _p: unknown,
      { id, note }: { id: string; note: string },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'EDIT');
      const before = await getSuppression(id);
      const row = await updateSuppressionNote(id, note);
      await recordAudit(ctx, {
        action: 'UPDATE',
        module: MODULE,
        entityId: id,
        entityLabel: row.email,
        summary: 'Edited the note',
        changes: { note: { from: before.note ?? '', to: row.note } },
      });
      return withId(row);
    },

    /** Archiving only hides the row: the sender reads archived rows like any other. */
    setMarketingSuppressionArchived: async (
      _p: unknown,
      { id, archived }: { id: string; archived: boolean },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'EDIT');
      const row = await getSuppression(id);
      await archiveRecords(MarketingSuppressionModel as never, [id], archived);
      await recordAudit(ctx, {
        action: 'UPDATE',
        module: MODULE,
        entityId: id,
        entityLabel: row.email,
        summary: archived ? 'Archived — still suppressed' : 'Unarchived',
      });
      return withId(await getSuppression(id));
    },

    /**
     * Lets campaigns reach an address again. Explicit and justified: a recipient's own
     * unsubscribe or spam complaint can only be lifted by an administrator.
     */
    removeMarketingSuppression: async (
      _p: unknown,
      { id, justification }: { id: string; justification: string },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'DELETE');
      const row = await getSuppression(id);
      if (CONSENT_REASONS.has(row.reason as SuppressionReason)) {
        assertRole(ctx, [ROLES.ADMIN]);
      }
      const why = justification.trim();
      if (why.length < MIN_JUSTIFICATION) {
        badRequest(`Say why in at least ${MIN_JUSTIFICATION} characters.`);
      }
      await MarketingSuppressionModel.deleteOne({ _id: id });
      await recordAudit(ctx, {
        action: 'DELETE',
        module: MODULE,
        entityId: id,
        entityLabel: row.email,
        summary: `Removed suppression (${row.reason}): ${why}`,
      });
      return true;
    },
  },
};

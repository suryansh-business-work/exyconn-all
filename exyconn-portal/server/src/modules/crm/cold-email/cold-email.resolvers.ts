import { ROLES } from '../../../constants/roles';
import { actorNameOf } from '../../../lib/actor';
import { auditArchive } from '../../../lib/archiveAudit';
import { archiveRecords } from '../../../lib/archivable';
import { assertPermission, PERMISSION_MODULES } from '../../../lib/permissions';
import { createLimiter, enforceLimit } from '../../../lib/rateLimiter';
import type { GraphQLContext } from '../../../middleware/auth';
import { stringOf, withId, withIds } from '../../../utils/serialize';
import { tableQuery, type TableConfig, type TableQueryInput } from '../../../utils/tableQuery';
import { recordAudit } from '../../audit';
import { assertRecordEdit } from '../../crm-integrations/crm-integrations.record';
import { auditGmail } from '../../gmail/gmail.audit';
import { auditMicrosoft } from '../../microsoft-mail';
import type { PermissionAction } from '../../permissions/permission.model';
import { registerBulkTarget, registerTable } from '../../table-transfer/registry';
import { ColdEmailDraftModel, type ColdEmailTone } from './cold-email.model';
import {
  MAX_VARIANTS,
  coldEmails,
  type ColdEmailAuthor,
  type CreateColdEmailInput,
  type SendColdEmailInput,
} from './cold-email.service';

const MODULE = 'ColdEmailDraft';
PERMISSION_MODULES.add(MODULE);

/** Every version is a paid AI run: a generous hourly cap per person. */
const generateLimiter = createLimiter({
  keyPrefix: 'cold_email_ai',
  points: 60,
  durationSec: 3600,
});

const TABLE: TableConfig = {
  searchFields: ['recordName', 'toEmail', 'goal', 'createdByName'],
  filterFields: ['recordId', 'object', 'status', 'recordName', 'toEmail', 'createdByName'],
  sortFields: ['updatedAt', 'createdAt', 'recordName', 'toEmail', 'status'],
  defaultSort: { field: 'updatedAt', dir: 'DESC' },
};
const LIST = 'coldEmailDrafts';

const desk = (ctx: GraphQLContext, action: PermissionAction) =>
  assertPermission(ctx, MODULE, [ROLES.CRM], action);

registerTable(LIST, TABLE);
registerBulkTarget(LIST, {
  entity: MODULE,
  archive: async (ctx, ids, archived) => {
    await desk(ctx, 'EDIT');
    const changed = await archiveRecords(ColdEmailDraftModel as never, ids, archived);
    await auditArchive(ctx, MODULE, ids, archived);
    return changed;
  },
});

/** Writing to a record with the AI: CRM, EDIT on the record, within the hourly cap. */
async function authorFor(
  ctx: GraphQLContext,
  object: 'CONTACT' | 'COMPANY',
): Promise<ColdEmailAuthor> {
  const user = await assertRecordEdit(ctx, object);
  await enforceLimit(generateLimiter, user.id, 'cold email drafts');
  return { id: user.id, name: user.email, displayName: await actorNameOf(ctx) };
}

type Draft = { _id: unknown; recordName?: string | null };
const audit = (
  ctx: GraphQLContext,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  draft: Draft,
  summary: string,
) =>
  recordAudit(ctx, {
    action,
    module: MODULE,
    entityId: stringOf(draft._id),
    entityLabel: draft.recordName ?? '',
    summary,
  });

export const coldEmailResolvers = {
  ColdEmailDraft: {
    variantCount: (row: { variants?: unknown[] }) => row.variants?.length ?? 0,
    maxVariants: () => MAX_VARIANTS,
  },
  ColdEmailVariant: {
    id: (row: { _id: unknown }) => stringOf(row._id),
    instruction: (row: { instruction?: string | null }) => row.instruction ?? '',
    sentMessageId: (row: { sentMessageId?: string | null }) => row.sentMessageId ?? '',
  },
  Query: {
    coldEmailDrafts: async (
      _p: unknown,
      { input }: { input: TableQueryInput },
      ctx: GraphQLContext,
    ) => {
      await desk(ctx, 'VIEW');
      const page = await tableQuery(ColdEmailDraftModel, input, TABLE);
      return { rows: withIds(page.rows as { _id: unknown }[]), totalCount: page.totalCount };
    },
    coldEmailDraft: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      await desk(ctx, 'VIEW');
      return withId(await coldEmails.get(id));
    },
  },
  Mutation: {
    createColdEmailDraft: async (
      _p: unknown,
      { input }: { input: CreateColdEmailInput },
      ctx: GraphQLContext,
    ) => {
      await desk(ctx, 'CREATE');
      const draft = await coldEmails.create(input, await authorFor(ctx, input.object));
      await audit(ctx, 'CREATE', draft, `Drafted a cold email to ${draft.toEmail}`);
      return withId(draft);
    },
    addColdEmailVariant: async (
      _p: unknown,
      args: { id: string; instruction?: string | null; tone?: ColdEmailTone | null },
      ctx: GraphQLContext,
    ) => {
      await desk(ctx, 'EDIT');
      const { object } = await coldEmails.get(args.id);
      const author = await authorFor(ctx, object);
      return withId(await coldEmails.addVariant(args.id, args, author));
    },
    rewriteColdEmailDraft: async (
      _p: unknown,
      args: { id: string; readWebsite?: boolean | null },
      ctx: GraphQLContext,
    ) => {
      await desk(ctx, 'EDIT');
      const { object } = await coldEmails.get(args.id);
      const author = await authorFor(ctx, object);
      const saved = await coldEmails.rewrite(args.id, args.readWebsite === true, author);
      await audit(ctx, 'UPDATE', saved, 'Rewrote the cold email from the latest data');
      return withId(saved);
    },
    updateColdEmailVariant: async (
      _p: unknown,
      args: { draftId: string; variantId: string; subject: string; body: string },
      ctx: GraphQLContext,
    ) => {
      await desk(ctx, 'EDIT');
      return withId(
        await coldEmails.updateVariant(args.draftId, args.variantId, args.subject, args.body),
      );
    },
    deleteColdEmailVariant: async (
      _p: unknown,
      args: { draftId: string; variantId: string },
      ctx: GraphQLContext,
    ) => {
      await desk(ctx, 'EDIT');
      const saved = await coldEmails.deleteVariant(args.draftId, args.variantId);
      await audit(ctx, 'UPDATE', saved, 'Deleted a cold email version');
      return withId(saved);
    },
    deleteColdEmailDraft: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      await desk(ctx, 'DELETE');
      const removed = await coldEmails.remove(id);
      await audit(ctx, 'DELETE', removed, `Deleted the cold email draft to ${removed.toEmail}`);
      return true;
    },
    sendColdEmailVariant: async (
      _p: unknown,
      { input }: { input: SendColdEmailInput },
      ctx: GraphQLContext,
    ) => {
      await desk(ctx, 'EDIT');
      const { object } = await coldEmails.get(input.draftId);
      await assertRecordEdit(ctx, object);
      const { draft, provider, sent } = await coldEmails.send(input, await actorNameOf(ctx));
      const summary = `Sent the cold email "${sent.subject}" from ${sent.mailbox} to ${sent.to.join(', ')}`;
      const mailAudit = provider === 'MICROSOFT' ? auditMicrosoft : auditGmail;
      await mailAudit(ctx, 'CREATE', { id: sent.gmailId, label: sent.subject }, summary);
      await audit(ctx, 'UPDATE', draft, summary);
      return withId(draft);
    },
  },
};

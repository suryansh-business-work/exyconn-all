import { isValidObjectId } from 'mongoose';
import { CampaignModel } from './marketing.model';
import { CampaignRevisionModel } from './campaign-revision.model';
import { PreferenceCategoryModel } from './preference.model';
import { VARIABLES } from './campaign.variables';
import { verifiedSenders } from './campaign.sender';
import { checkDraft, createSendingRevision, type RevisionActor } from './campaign.revision';
import { previewContent, sendTestEmail, type PreviewInput } from './campaign.preview';
import { saveDraft } from './campaign.draft';
import { campaignDeliveryStats, marketingDashboard } from './campaign.analytics';
import { loadAudienceShape, resolveAudience } from './audience.resolve';
import { retryFailedCopies } from './marketing.send';
import { dispatchNow } from './marketing.schedule';
import { ContactModel } from '../crm/contact.model';
import { CompanyModel } from '../crm/company.model';
import { UserModel } from '../admin/user.model';
import { recordAudit } from '../audit';
import { assertPermission } from '../../lib/permissions';
import { withId, withIds } from '../../utils/serialize';
import { escapeRegex } from '../../utils/tableQuery';
import { portalOrigin } from '../../utils/portalOrigin';
import { badRequest, notFound } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { ROLES } from '../../constants/roles';
import type { GraphQLContext } from '../../middleware/auth';

const MODULE = 'Campaign';
const OPTION_LIMIT = 10;

type Action = 'VIEW' | 'CREATE' | 'EDIT' | 'DELETE';
const guard = (ctx: GraphQLContext, action: Action) =>
  assertPermission(ctx, MODULE, [ROLES.MARKETING], action);

export async function actorOf(ctx: GraphQLContext): Promise<RevisionActor> {
  const id = ctx.user?.id ?? '';
  const user = isValidObjectId(id) ? await UserModel.findById(id).select('name').lean() : null;
  return { id, name: user?.name ?? ctx.user?.email ?? '' };
}

async function campaignOrThrow(id: string) {
  const campaign = await CampaignModel.findById(id);
  if (!campaign) {
    return notFound('Campaign');
  }
  return campaign;
}

const audit = (ctx: GraphQLContext, id: string, label: string, summary: string) =>
  recordAudit(ctx, { action: 'UPDATE', module: MODULE, entityId: id, entityLabel: label, summary });

const previewOf = (
  campaign: InstanceType<typeof CampaignModel>,
  recordKind?: string | null,
  recordId?: string | null,
): PreviewInput => ({
  campaignName: campaign.name,
  senderName: campaign.senderName,
  subject: campaign.subject,
  preheader: campaign.preheader,
  mjml: campaign.mjml,
  recordKind: (recordKind as PreviewInput['recordKind']) ?? null,
  recordId: recordId ?? null,
});

/** A search across contacts and companies with an address, for "Preview as". */
async function previewRecordOptions(search: string) {
  const name = new RegExp(escapeRegex(search.trim()), 'i');
  const filter = { $or: [{ name }, { email: name }, { 'emails.address': name }] };
  const [contacts, companies] = await Promise.all([
    ContactModel.find(filter).select('name email').limit(OPTION_LIMIT).lean(),
    CompanyModel.find(filter).select('name emails').limit(OPTION_LIMIT).lean(),
  ]);
  return [
    ...contacts.map((row) => ({
      kind: 'CONTACT',
      id: String(row._id),
      name: row.name,
      email: row.email,
    })),
    ...companies.map((row) => ({
      kind: 'COMPANY',
      id: String(row._id),
      name: row.name,
      email: row.emails?.[0]?.address ?? '',
    })),
  ];
}

export const campaignStudioResolvers = {
  Query: {
    campaignStudioOptions: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await guard(ctx, 'VIEW');
      const [senders, categories] = await Promise.all([
        verifiedSenders(),
        PreferenceCategoryModel.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean(),
      ]);
      return {
        verifiedSenders: senders,
        variables: VARIABLES.map(({ key, group, label, description, example }) => ({
          key,
          group,
          label,
          description,
          example,
        })),
        categories: withIds(categories),
      };
    },

    previewCampaignContent: async (
      _p: unknown,
      { input }: { input: PreviewInput },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'VIEW');
      return previewContent(input, portalOrigin(ctx.origin));
    },

    campaignQualityChecks: async (
      _p: unknown,
      { id, audienceListId }: { id: string; audienceListId?: string | null },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'VIEW');
      const campaign = await campaignOrThrow(id);
      const { checks } = await checkDraft(campaign);
      let counts = null;
      if (audienceListId) {
        const audience = await loadAudienceShape(audienceListId);
        counts = (await resolveAudience(audience, audienceListId, campaign.preferenceCategoryId))
          .counts;
        if (counts.eligible === 0) {
          checks.push({
            code: 'AUDIENCE_EMPTY',
            severity: 'ERROR',
            message: 'Nobody in this audience can be sent to.',
            line: null,
          });
        }
      }
      return { checks, counts, canSend: !checks.some((found) => found.severity === 'ERROR') };
    },

    previewRecordOptions: async (
      _p: unknown,
      { search }: { search: string },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'VIEW');
      return search.trim() ? previewRecordOptions(search) : [];
    },

    campaignRevisions: async (
      _p: unknown,
      { campaignId }: { campaignId: string },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'VIEW');
      return withIds(
        await CampaignRevisionModel.find({ campaignId })
          .sort({ version: -1 })
          .select('version subject createdByName createdAt')
          .lean(),
      );
    },

    campaignDeliveryStats: async (
      _p: unknown,
      { campaignId }: { campaignId: string },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'VIEW');
      return campaignDeliveryStats(campaignId);
    },

    marketingDashboard: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await guard(ctx, 'VIEW');
      return marketingDashboard();
    },
  },

  Mutation: {
    saveCampaignDraft: async (
      _p: unknown,
      {
        id,
        input,
        expectedVersion,
      }: { id?: string | null; input: unknown; expectedVersion?: number | null },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, id ? 'EDIT' : 'CREATE');
      const saved = await saveDraft(id ?? null, input, expectedVersion ?? null);
      if (!id) {
        await recordAudit(ctx, {
          action: 'CREATE',
          module: MODULE,
          entityId: saved._id,
          entityLabel: saved.name,
          summary: 'Created Campaign',
        });
      }
      return withId(saved as { _id: unknown });
    },

    queueCampaignSend: async (
      _p: unknown,
      {
        id,
        audienceListId,
        scheduledAt,
      }: { id: string; audienceListId: string; scheduledAt?: Date | null },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'EDIT');
      const campaign = await campaignOrThrow(id);
      if (campaign.sendState === 'SENDING' || campaign.sendState === 'QUEUED') {
        badRequest('This campaign is already queued or sending. Cancel it first to change it.');
      }
      if (scheduledAt && new Date(scheduledAt).getTime() < Date.now() - 60_000) {
        badRequest('Choose a time in the future.');
      }
      const revision = await createSendingRevision(campaign, await actorOf(ctx));
      Object.assign(campaign, {
        scheduledAt: scheduledAt ?? new Date(),
        scheduledAudienceListId: audienceListId,
        scheduleDispatchedAt: null,
        sendingRevisionId: String(revision._id),
        sendState: 'QUEUED',
        cancelRequestedAt: null,
      });
      await campaign.save();
      await audit(
        ctx,
        id,
        campaign.name,
        `Queued revision ${revision.version}${scheduledAt ? ' (scheduled)' : ' (send now)'}`,
      );
      if (!scheduledAt) {
        dispatchNow();
      }
      return withId(campaign.toObject() as { _id: unknown });
    },

    cancelCampaignSend: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      await guard(ctx, 'EDIT');
      const campaign = await campaignOrThrow(id);
      if (campaign.sendState === 'QUEUED' && !campaign.scheduleDispatchedAt) {
        Object.assign(campaign, { scheduledAt: null, sendState: 'CANCELLED' });
      } else if (campaign.sendState === 'SENDING' || campaign.sendState === 'QUEUED') {
        campaign.cancelRequestedAt = new Date();
      } else {
        badRequest('Only a queued or sending campaign can be cancelled.');
      }
      await campaign.save();
      await audit(ctx, id, campaign.name, 'Cancelled the send');
      return withId(campaign.toObject() as { _id: unknown });
    },

    retryCampaignFailures: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      await guard(ctx, 'EDIT');
      const campaign = await campaignOrThrow(id);
      if (campaign.sendState === 'SENDING') {
        badRequest('Wait for the current send to finish.');
      }
      await audit(ctx, id, campaign.name, 'Retried failed copies');
      const result = await retryFailedCopies(campaign, portalOrigin());
      logger.info(
        `Campaign "${campaign.name}" retry: ${result.sent} sent, ${result.failed} failed`,
      );
      return result;
    },

    sendCampaignTest: async (
      _p: unknown,
      {
        id,
        to,
        recordKind,
        recordId,
      }: { id: string; to: string; recordKind?: string | null; recordId?: string | null },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'EDIT');
      const campaign = await campaignOrThrow(id);
      await sendTestEmail(
        { ...previewOf(campaign, recordKind, recordId), replyTo: campaign.replyTo },
        to,
        portalOrigin(ctx.origin),
      );
      return true;
    },
  },
};

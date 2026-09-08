import { CampaignModel } from './marketing.model';
import { CampaignSendModel } from './campaign-send.model';
import { resolveAudienceMembers } from './marketing.audience';
import { loadAudience, renderForMember, runCampaignSend, sendPreview } from './marketing.send';
import { unsubscribeByToken } from './marketing.suppression';
import { AudienceListModel } from './audience.model';
import { LeadModel } from '../crm/crm.model';
import { assertRole } from '../../middleware/roleGuard';
import { withId, withIds } from '../../utils/serialize';
import { notFound, badRequest } from '../../utils/errors';
import { portalOrigin } from '../../utils/portalOrigin';
import { ROLES } from '../../constants/roles';
import type { GraphQLContext } from '../../middleware/auth';

/** Stands in for a real token in a preview — no token is minted for an email nobody sends. */
const PREVIEW_LINK = '/unsubscribe?t=preview';

const guard = (ctx: GraphQLContext) => assertRole(ctx, [ROLES.MARKETING]);
/** Attribution is read from both sides: marketing reports it, sales records it. */
const attributionGuard = (ctx: GraphQLContext) => assertRole(ctx, [ROLES.MARKETING, ROLES.CRM]);

interface SendArgs {
  id: string;
  audienceListId?: string | null;
  testEmail?: string | null;
}

/** An audience row as it may exist on disk, from before contacts and segments were added. */
interface StoredAudience {
  contactIds?: string[] | null;
  dynamicSegment?: string | null;
  segmentValue?: string | null;
}

/** Custom Marketing resolvers layered on top of the campaign and audience CRUD. */
export const marketingCustomResolvers = {
  /** Written before contacts and segments existed, a `.lean()` row comes back without these. */
  AudienceList: {
    contactIds: (audience: StoredAudience) => audience.contactIds ?? [],
    dynamicSegment: (audience: StoredAudience) => audience.dynamicSegment ?? 'NONE',
    segmentValue: (audience: StoredAudience) => audience.segmentValue ?? '',
  },
  Query: {
    /** Every recipient of a campaign's sends, newest first — the delivery report. */
    listCampaignSends: async (
      _p: unknown,
      { campaignId }: { campaignId: string },
      ctx: GraphQLContext,
    ) => {
      guard(ctx);
      const rows = await CampaignSendModel.find({ campaignId }).sort({ sentAt: -1 }).lean();
      return withIds(rows);
    },

    /**
     * Who an audience currently reaches. The page shows a real recipient count instead of
     * the length of an array that stopped being the whole answer when segments arrived.
     */
    audienceMembers: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      guard(ctx);
      const audience = await AudienceListModel.findById(id).lean();
      if (!audience) {
        notFound('Audience list');
      }
      return resolveAudienceMembers(audience);
    },

    /** Sent, failed and skipped for one campaign, counted by the database rather than the page. */
    campaignSendSummary: async (
      _p: unknown,
      { campaignId }: { campaignId: string },
      ctx: GraphQLContext,
    ) => {
      guard(ctx);
      const rows = await CampaignSendModel.aggregate<{ _id: string; count: number }>([
        { $match: { campaignId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);
      const countOf = (status: string) => rows.find((row) => row._id === status)?.count ?? 0;
      return { sent: countOf('SENT'), failed: countOf('FAILED'), skipped: countOf('SKIPPED') };
    },

    /** Campaigns as pickable options, so a salesperson can attribute a lead to one. */
    campaignOptions: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      attributionGuard(ctx);
      const rows = await CampaignModel.find().select('name').sort({ name: 1 }).lean();
      return withIds(rows).map((row) => ({ id: row.id, name: row.name }));
    },

    /**
     * The first member's copy, rendered by the code that will do the sending.
     *
     * A preview built separately in the browser is a second implementation of the merge
     * rules, and the day it disagrees with the server is the day it goes out wrong.
     */
    campaignPreview: async (
      _p: unknown,
      { id, audienceListId }: { id: string; audienceListId: string },
      ctx: GraphQLContext,
    ) => {
      guard(ctx);
      const campaign = await CampaignModel.findById(id).lean();
      if (!campaign) {
        notFound('Campaign');
      }
      const { members } = await loadAudience(audienceListId);
      const [first] = members;
      if (!first) {
        return null;
      }
      const rendered = renderForMember(
        campaign,
        first,
        `${portalOrigin(ctx.origin)}${PREVIEW_LINK}`,
      );
      return { recipient: first.email, subject: rendered.subject, body: rendered.body };
    },

    /**
     * Leads per campaign, in one aggregation.
     *
     * The overview lists several campaigns at once, and asking `leadsByCampaign` for each
     * of them would be a query per row on a page that is meant to be a glance.
     */
    campaignLeadCounts: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      attributionGuard(ctx);
      const rows = await LeadModel.aggregate<{ _id: string; leads: number }>([
        { $match: { campaignId: { $nin: [null, ''] } } },
        { $group: { _id: '$campaignId', leads: { $sum: 1 }, name: { $last: '$campaignName' } } },
        { $sort: { leads: -1 } },
      ]);
      return rows.map((row) => ({
        campaignId: row._id,
        campaignName: (row as { name?: string }).name ?? '',
        leads: row.leads,
      }));
    },

    /** How many leads a campaign produced — the only number that says whether it worked. */
    leadsByCampaign: async (
      _p: unknown,
      { campaignId }: { campaignId: string },
      ctx: GraphQLContext,
    ) => {
      attributionGuard(ctx);
      return LeadModel.countDocuments({ campaignId });
    },
  },

  Mutation: {
    /**
     * Emails the campaign to a saved audience, or — with `testEmail` — to one address
     * as a preview. The audience is the only way to a real send: a hand-picked recipient
     * set could never be repeated, and nobody could say later who a campaign had gone to.
     */
    sendCampaign: async (
      _p: unknown,
      { id, audienceListId, testEmail }: SendArgs,
      ctx: GraphQLContext,
    ) => {
      guard(ctx);
      const campaign = await CampaignModel.findById(id);
      if (!campaign) {
        notFound('Campaign');
      }
      if (!campaign.subject || !campaign.body) {
        badRequest('Add an email subject and body before sending this campaign.');
      }
      const origin = portalOrigin(ctx.origin);
      const asResult = (sent: number, failed: number, skipped: number) => ({
        sent,
        failed,
        skipped,
        campaign: withId(campaign.toObject() as { _id: unknown }),
      });

      if (testEmail) {
        await sendPreview(campaign, testEmail, origin);
        return asResult(1, 0, 0);
      }
      if (!audienceListId) {
        badRequest('Choose an audience to send to, or an address for a test send.');
      }
      const result = await runCampaignSend(campaign, audienceListId, origin);
      return asResult(result.sent, result.failed, result.skipped);
    },

    /**
     * Honours an unsubscribe link from a campaign email. Public: the person clicking it
     * has no portal account, and requiring one would make the opt-out unusable.
     */
    unsubscribeFromMarketing: (
      _p: unknown,
      { token }: { token: string },
      ctx: GraphQLContext,
    ): Promise<boolean> => unsubscribeByToken(token, ctx.ip ?? 'unknown'),
  },
};

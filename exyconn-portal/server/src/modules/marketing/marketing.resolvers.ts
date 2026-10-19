import { CampaignModel } from './marketing.model';
import { CampaignSendModel } from './campaign-send.model';
import { unsubscribeByToken } from './marketing.public';
import { LeadModel } from '../crm/crm.model';
import { assertRole } from '../../middleware/roleGuard';
import { withIds } from '../../utils/serialize';
import { ROLES } from '../../constants/roles';
import type { GraphQLContext } from '../../middleware/auth';

const guard = (ctx: GraphQLContext) => assertRole(ctx, [ROLES.MARKETING]);
/** Attribution is read from both sides: marketing reports it, sales records it. */
const attributionGuard = (ctx: GraphQLContext) => assertRole(ctx, [ROLES.MARKETING, ROLES.CRM]);

/** Custom Marketing resolvers layered on top of the campaign and audience CRUD. */
export const marketingCustomResolvers = {
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

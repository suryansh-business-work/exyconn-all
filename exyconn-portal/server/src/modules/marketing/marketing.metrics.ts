import { CampaignSendModel } from './campaign-send.model';
import { CampaignClickModel } from './campaign-click.model';
import { assertRole } from '../../middleware/roleGuard';
import { ROLES } from '../../constants/roles';
import type { GraphQLContext } from '../../middleware/auth';

const marketingRoles = [ROLES.MARKETING];

/** A rate as a whole percentage, 0 when there is nothing to divide by. */
function rate(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

/**
 * What a campaign actually did.
 *
 * Opens are reported as a FLOOR, not a count, and the UI says so: mail clients prefetch
 * images, cache them, and very often block them outright. A campaign showing 30% opened was
 * opened by at least 30% — treating it as the true number is how marketing decisions get made
 * on a statistic that cannot go up but can silently be wrong by half.
 *
 * Clicks have no such problem. A click is a person doing something, and it is the number
 * worth optimising against.
 */
export async function campaignMetricsFor(campaignId: string) {
  const [sent, opened, clicked, totals] = await Promise.all([
    CampaignSendModel.countDocuments({ campaignId, status: 'SENT' }),
    CampaignSendModel.countDocuments({ campaignId, status: 'SENT', openedAt: { $ne: null } }),
    CampaignSendModel.countDocuments({ campaignId, status: 'SENT', clickCount: { $gt: 0 } }),
    CampaignSendModel.aggregate<{ opens: number; clicks: number }>([
      { $match: { campaignId, status: 'SENT' } },
      { $group: { _id: null, opens: { $sum: '$openCount' }, clicks: { $sum: '$clickCount' } } },
    ]),
  ]);

  return {
    campaignId,
    sent,
    /** Distinct recipients who opened at least once. */
    opened,
    clicked,
    totalOpens: totals[0]?.opens ?? 0,
    totalClicks: totals[0]?.clicks ?? 0,
    openRate: rate(opened, sent),
    clickRate: rate(clicked, sent),
    /** Of the people who opened, how many went on to click — the message's own persuasion. */
    clickThroughRate: rate(clicked, opened),
  };
}

/** The links a campaign's recipients actually clicked, most-clicked first. */
async function topLinks(campaignId: string) {
  const rows = await CampaignClickModel.aggregate<{
    _id: string;
    clicks: number;
    people: string[];
  }>([
    { $match: { campaignId } },
    { $group: { _id: '$url', clicks: { $sum: 1 }, people: { $addToSet: '$to' } } },
    { $sort: { clicks: -1 } },
    { $limit: 20 },
  ]);
  return rows.map((row) => ({ url: row._id, clicks: row.clicks, people: row.people.length }));
}

export const marketingMetricsResolvers = {
  Query: {
    campaignMetrics: async (
      _p: unknown,
      { campaignId }: { campaignId: string },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, marketingRoles);
      return campaignMetricsFor(campaignId);
    },
    campaignTopLinks: async (
      _p: unknown,
      { campaignId }: { campaignId: string },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, marketingRoles);
      return topLinks(campaignId);
    },
  },
};

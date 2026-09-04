import { CampaignModel } from './marketing.model';
import { AudienceListModel } from './audience.model';
import { CampaignSendModel } from './campaign-send.model';
import { ClientModel } from '../clients/clients.model';
import { assertRole } from '../../middleware/roleGuard';
import { withId, withIds } from '../../utils/serialize';
import { notFound, badRequest } from '../../utils/errors';
import { mailer } from '../../utils/mailer';
import { logger } from '../../utils/logger';
import { ROLES } from '../../constants/roles';
import type { GraphQLContext } from '../../middleware/auth';

const guard = (ctx: GraphQLContext) => assertRole(ctx, [ROLES.MARKETING]);

/** One recipient's outcome, before it is written to the send log. */
interface SendOutcome {
  to: string;
  recipientName: string;
  status: 'SENT' | 'FAILED';
  error: string;
}

/** Emails one client and reports what happened, rather than throwing at the first failure. */
async function sendOne(
  client: { name: string; email: string },
  campaign: { name: string; subject: string; body: string },
): Promise<SendOutcome> {
  const base = { to: client.email, recipientName: client.name };
  try {
    await mailer.sendCustomEmail({
      name: client.name,
      email: client.email,
      subject: campaign.subject,
      message: campaign.body,
    });
    return { ...base, status: 'SENT', error: '' };
  } catch (err) {
    logger.error({ err, email: client.email }, `Campaign "${campaign.name}" email failed`);
    return { ...base, status: 'FAILED', error: err instanceof Error ? err.message : 'Send failed' };
  }
}

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
  },
  Mutation: {
    /**
     * Emails the campaign to a saved audience. The audience is the only way in: a
     * hand-picked recipient set could never be repeated, and nobody could say later
     * who a campaign had gone to.
     */
    sendCampaign: async (
      _p: unknown,
      { id, audienceListId }: { id: string; audienceListId: string },
      ctx: GraphQLContext,
    ) => {
      guard(ctx);
      const campaign = await CampaignModel.findById(id);
      if (!campaign) notFound('Campaign');
      if (!campaign.subject || !campaign.body) {
        badRequest('Add an email subject and body before sending this campaign.');
      }

      const audience = await AudienceListModel.findById(audienceListId).lean();
      if (!audience) notFound('Audience list');
      if (!audience.clientIds.length) badRequest(`"${audience.name}" has no clients in it.`);

      const clients = await ClientModel.find({ _id: { $in: audience.clientIds } }).lean();
      if (!clients.length) badRequest(`No client in "${audience.name}" still exists.`);

      const outcomes: SendOutcome[] = [];
      for (const client of clients) {
        outcomes.push(await sendOne(client, campaign));
      }

      await CampaignSendModel.insertMany(
        outcomes.map((outcome) => ({ ...outcome, campaignId: id, audienceListId })),
      );

      const sent = outcomes.filter((outcome) => outcome.status === 'SENT').length;
      campaign.lastSentAt = new Date();
      campaign.recipientsCount = sent;
      await campaign.save();
      return {
        sent,
        failed: outcomes.length - sent,
        campaign: withId(campaign.toObject() as { _id: unknown }),
      };
    },
  },
};

import { CampaignModel } from './marketing.model';
import { ClientModel } from '../clients/clients.model';
import { assertRole } from '../../middleware/roleGuard';
import { withId } from '../../utils/serialize';
import { notFound, badRequest } from '../../utils/errors';
import { mailer } from '../../utils/mailer';
import { logger } from '../../utils/logger';
import { ROLES } from '../../constants/roles';
import type { GraphQLContext } from '../../middleware/auth';

const guard = (ctx: GraphQLContext) => assertRole(ctx, [ROLES.MARKETING]);

/** Custom Marketing mutations layered on top of the campaign CRUD. */
export const marketingCustomResolvers = {
  Mutation: {
    sendCampaign: async (
      _p: unknown,
      { id, clientIds }: { id: string; clientIds: string[] },
      ctx: GraphQLContext,
    ) => {
      guard(ctx);
      const campaign = await CampaignModel.findById(id);
      if (!campaign) notFound('Campaign');
      if (!campaign.subject || !campaign.body) {
        badRequest('Add an email subject and body before sending this campaign.');
      }
      if (!clientIds.length) badRequest('Select at least one client to send to.');

      const clients = await ClientModel.find({ _id: { $in: clientIds } }).lean();
      if (!clients.length) badRequest('No matching clients found.');

      let sent = 0;
      let failed = 0;
      for (const client of clients) {
        try {
          await mailer.sendCustomEmail({
            name: client.name,
            email: client.email,
            subject: campaign.subject,
            message: campaign.body,
          });
          sent += 1;
        } catch (err) {
          failed += 1;
          logger.error({ err, email: client.email }, `Campaign "${campaign.name}" email failed`);
        }
      }

      campaign.lastSentAt = new Date();
      campaign.recipientsCount = sent;
      await campaign.save();
      return { sent, failed, campaign: withId(campaign.toObject() as { _id: unknown }) };
    },
  },
};

import { assertRole } from '../../../middleware/roleGuard';
import { ROLES } from '../../../constants/roles';
import {
  deleteChannel,
  getChannel,
  saveChannel,
  type WhatsappChannelInput,
} from './channel.service';
import type { GraphQLContext } from '../../../middleware/auth';

export { whatsappChannelTypeDefs } from './channel.typeDefs';

/**
 * The real WhatsApp number behind the demo: the same published workflows, answered on
 * WhatsApp itself through Meta's Cloud API. Configured by the company's administrators.
 */

const admin = (ctx: GraphQLContext) => assertRole(ctx, [ROLES.ADMIN, ROLES.SUPER_ADMIN]);

export const whatsappChannelResolvers = {
  Query: {
    whatsappChannel: (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      admin(ctx);
      return getChannel();
    },
  },
  Mutation: {
    saveWhatsappChannel: (
      _p: unknown,
      { input }: { input: WhatsappChannelInput },
      ctx: GraphQLContext,
    ) => {
      admin(ctx);
      return saveChannel(ctx, input);
    },
    deleteWhatsappChannel: (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      admin(ctx);
      return deleteChannel(ctx);
    },
  },
};

export { WEBHOOK_PATH } from './channel.service';
export { whatsappWebhookRouter } from './channel.webhook';
export { startWhatsappReminders } from './channel.reminders';

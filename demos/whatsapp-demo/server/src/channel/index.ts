import { assertRole } from '../../../../../exyconn-portal/server/src/middleware/roleGuard';
import { ROLES } from '../../../../../exyconn-portal/server/src/constants/roles';
import {
  deleteChannel,
  getChannel,
  saveChannel,
  testChannel,
  type WhatsappChannelInput,
  type WhatsappChannelTestInput,
} from './channel.service';
import type { GraphQLContext } from '../../../../../exyconn-portal/server/src/middleware/auth';
import { assertPlatformStaff } from '../../../../../exyconn-portal/server/src/lib/platformAccess';
import type { PermissionAction } from '../../../../../exyconn-portal/server/src/modules/permissions/permission.model';

export { whatsappChannelTypeDefs } from './channel.typeDefs';

/**
 * The real WhatsApp number behind the demo: the same published workflows, answered on
 * WhatsApp itself through Meta's Cloud API. Configured by the company's administrators, or by
 * the platform's Tech staff from Tech > Demos > WhatsApp bot.
 */

const ADMIN_ROLES: ReadonlySet<string> = new Set([ROLES.ADMIN, ROLES.SUPER_ADMIN]);

/** A company administrator, or the platform's Tech staff with the Tech settings permission. */
async function manager(ctx: GraphQLContext, action: PermissionAction): Promise<void> {
  if (ctx.user?.roles?.some((role) => ADMIN_ROLES.has(role))) {
    assertRole(ctx, [ROLES.ADMIN, ROLES.SUPER_ADMIN]);
    return;
  }
  await assertPlatformStaff(ctx, 'TechConfig', [ROLES.TECH], action);
}

export const whatsappChannelResolvers = {
  Query: {
    whatsappChannel: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await manager(ctx, 'VIEW');
      return getChannel();
    },
  },
  Mutation: {
    saveWhatsappChannel: async (
      _p: unknown,
      { input }: { input: WhatsappChannelInput },
      ctx: GraphQLContext,
    ) => {
      await manager(ctx, 'EDIT');
      return saveChannel(ctx, input);
    },
    deleteWhatsappChannel: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await manager(ctx, 'DELETE');
      return deleteChannel(ctx);
    },
    testWhatsappChannel: async (
      _p: unknown,
      { input }: { input: WhatsappChannelTestInput },
      ctx: GraphQLContext,
    ) => {
      await manager(ctx, 'EDIT');
      return testChannel(input);
    },
  },
};

export { WEBHOOK_PATH } from './channel.service';
export { whatsappWebhookRouter } from './channel.webhook';
export { startWhatsappReminders } from './channel.reminders';

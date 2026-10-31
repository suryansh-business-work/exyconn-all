import type { GraphQLContext } from '../../middleware/auth';
import { assertAgentStaff } from './agents.access';
import { agentsOverview, overviewDays } from './agents.overview';

export { agentsTypeDefs } from './agents.typeDefs';
export { AGENTS_MODULE, AGENTS_ROLES, assertAgentStaff } from './agents.access';
export { grantAgentsRole } from './agents.migrate';

/**
 * The Agents console (agents.exyconn.com). Its screens run on the bots' own modules — the
 * calling bot, the bot studio, the website chat and the WhatsApp demo leads; this module adds
 * only what spans them: the overview.
 */
export const agentsResolvers = {
  Query: {
    agentsOverview: async (
      _p: unknown,
      { days }: { days?: number | null },
      ctx: GraphQLContext,
    ) => {
      await assertAgentStaff(ctx, 'VIEW');
      return agentsOverview(overviewDays(days));
    },
  },
};

import { healthService } from './health.service';
import { assertRole } from '../../middleware/roleGuard';
import { ROLES } from '../../constants/roles';
import type { GraphQLContext } from '../../middleware/auth';

/**
 * System Health is an operations screen: it names the database, the process and the
 * background schedulers, so it stays ADMIN-only rather than joining the permission
 * matrix where a role could be granted a partial view of it.
 */
export const healthResolvers = {
  Query: {
    systemHealth: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, [ROLES.ADMIN]);
      return healthService.overview();
    },
  },
};

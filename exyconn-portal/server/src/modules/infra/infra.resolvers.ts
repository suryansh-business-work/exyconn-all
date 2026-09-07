import { infraService } from './infra.service';
import { assertPermission } from '../../lib/permissions';
import { ROLES } from '../../constants/roles';
import type { GraphQLContext } from '../../middleware/auth';

/**
 * Infrastructure is a Tech screen; ADMIN passes every guard anyway. It is read-only, but
 * it still describes the host in detail, so it is never open to the rest of the portal.
 */
const techOnly = [ROLES.TECH];

/** The module name the admin permission matrix restricts this screen under. */
const INFRA_MODULE = 'Infrastructure';

/** Read-only, so VIEW is the only action there is to restrict. */
const guard = (ctx: GraphQLContext) => assertPermission(ctx, INFRA_MODULE, techOnly, 'VIEW');

export const infraResolvers = {
  Query: {
    infrastructureOverview: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await guard(ctx);
      return infraService.overview();
    },
    dockerContainers: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await guard(ctx);
      const containers = await infraService.containers();
      // Copy before sorting: `toSorted` is ES2023 and the server compiles against ES2021.
      return [...containers].sort((a, b) => a.name.localeCompare(b.name));
    },
    dockerContainerDetail: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      await guard(ctx);
      return infraService.containerDetail(id);
    },
    dockerStorage: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await guard(ctx);
      return infraService.storage();
    },
  },
};

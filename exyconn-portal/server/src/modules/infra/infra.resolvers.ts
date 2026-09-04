import { infraService } from './infra.service';
import { assertRole } from '../../middleware/roleGuard';
import { ROLES } from '../../constants/roles';
import type { GraphQLContext } from '../../middleware/auth';

/**
 * Infrastructure is a Tech screen; ADMIN passes every guard anyway. It is read-only, but
 * it still describes the host in detail, so it is never open to the rest of the portal.
 */
const techOnly = [ROLES.TECH];

export const infraResolvers = {
  Query: {
    infrastructureOverview: (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, techOnly);
      return infraService.overview();
    },
    dockerContainers: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, techOnly);
      const containers = await infraService.containers();
      // Copy before sorting: `toSorted` is ES2023 and the server compiles against ES2021.
      return [...containers].sort((a, b) => a.name.localeCompare(b.name));
    },
    dockerContainerDetail: (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      assertRole(ctx, techOnly);
      return infraService.containerDetail(id);
    },
    dockerStorage: (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, techOnly);
      return infraService.storage();
    },
  },
};

import { listAuditLogsPaged, listAuditLogsStats } from './audit.service';
import { assertRole } from '../../middleware/roleGuard';
import { ROLES } from '../../constants/roles';
import { withIds } from '../../utils/serialize';
import type { GraphQLContext } from '../../middleware/auth';
import type { TableQueryInput } from '../../utils/tableQuery';

type LeanDoc = { _id: unknown };

const adminOnly = [ROLES.ADMIN];

export const auditResolvers = {
  Query: {
    listAuditLogsPaged: async (
      _p: unknown,
      { input }: { input: TableQueryInput },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, adminOnly);
      const page = await listAuditLogsPaged(input);
      return { rows: withIds(page.rows as LeanDoc[]), totalCount: page.totalCount };
    },
    listAuditLogsStats: (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, adminOnly);
      return listAuditLogsStats();
    },
  },
};

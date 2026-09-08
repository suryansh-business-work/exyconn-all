import { listAuditLogsPaged, listAuditLogsStats } from './audit.service';
import { assertPermission } from '../../lib/permissions';
import { ROLES } from '../../constants/roles';
import { withIds } from '../../utils/serialize';
import type { GraphQLContext } from '../../middleware/auth';
import type { TableQueryInput } from '../../utils/tableQuery';

type LeanDoc = { _id: unknown };

const adminOnly = [ROLES.ADMIN];

/** The log is read-only, so VIEW is the only action the matrix has to restrict. */
const guard = (ctx: GraphQLContext) => assertPermission(ctx, 'AuditLog', adminOnly, 'VIEW');

export const auditResolvers = {
  Query: {
    listAuditLogsPaged: async (
      _p: unknown,
      { input }: { input: TableQueryInput },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx);
      const page = await listAuditLogsPaged(input);
      return { rows: withIds(page.rows as LeanDoc[]), totalCount: page.totalCount };
    },
    listAuditLogsStats: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await guard(ctx);
      return listAuditLogsStats();
    },
  },
};

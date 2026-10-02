import { listAuditLogsPaged, listAuditLogsStats } from '../audit';
import { assertPermission, PERMISSION_MODULES } from '../../lib/permissions';
import { ROLES } from '../../constants/roles';
import { withIds } from '../../utils/serialize';
import type { GraphQLContext } from '../../middleware/auth';
import type { TableQueryInput } from '../../utils/tableQuery';

/**
 * The audit modules that make up the finance books — every name a finance or expense write
 * records itself under. The change log reads these and nothing else, so a finance user never
 * sees who signed in or which roles changed.
 */
export const FINANCE_AUDIT_MODULES: readonly string[] = Object.freeze([
  'Invoice',
  'RecurringInvoice',
  'Payment',
  'CompanyExpense',
  'ExpenseClaim',
  'CostCenter',
  'Budget',
]);

const CHANGE_LOG_MODULE = 'FinanceChangeLog';
PERMISSION_MODULES.add(CHANGE_LOG_MODULE);

/** Applied under every grid request, before the client's own search and filters. */
const financeScope = { module: { $in: [...FINANCE_AUDIT_MODULES] } };

/** Read-only, so VIEW is the only action the permission matrix has to restrict. */
const guard = (ctx: GraphQLContext) =>
  assertPermission(ctx, CHANGE_LOG_MODULE, [ROLES.FINANCE], 'VIEW');

export const financeChangeLogResolvers = {
  Query: {
    listFinanceChangeLogPaged: async (
      _p: unknown,
      { input }: { input: TableQueryInput },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx);
      const page = await listAuditLogsPaged(input, financeScope);
      return { rows: withIds(page.rows as Array<{ _id: unknown }>), totalCount: page.totalCount };
    },
    listFinanceChangeLogStats: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await guard(ctx);
      return listAuditLogsStats(financeScope);
    },
  },
};

import { financeTypeDefs } from '../../finance/finance.typeDefs';
import { financeBillingTypeDefs } from '../../finance/finance.billing.typeDefs';
import { financeCompanyTypeDefs } from '../../finance/finance.company.typeDefs';
import { financeBudgetTypeDefs } from '../../finance/finance.budgets.typeDefs';
import { financeRecurringTypeDefs } from '../../finance/finance.recurring.typeDefs';
import { financeChangeLogTypeDefs } from '../../finance/finance.changelog.typeDefs';
import { expensesTypeDefs } from '../../expenses/expenses.typeDefs';
import { ROLES } from '../../../constants/roles';
import type { McpServerSpec } from './spec';

/**
 * Finance as an MCP server: invoices, payments and billing, the company's finance settings,
 * budgets, recurring invoices, the change log and expenses.
 *
 * A Finance feature added to one of these typeDefs is a tool the next time the server starts.
 * A NEW Finance module adds its typeDefs here — see docs/portal/mcp/README.md.
 */
export const FINANCE_MCP: McpServerSpec = {
  key: 'finance',
  name: 'exyconn-finance',
  label: 'Finance',
  role: ROLES.FINANCE,
  auditModule: 'Finance (Claude MCP)',
  instructions:
    'Exyconn Finance: invoices, payments and billing, company finance settings, budgets, recurring invoices, the finance change log and expenses. Every tool runs as the signed-in person with their own permissions; read before you change, and confirm with the person before deleting, sending or recording any money movement.',
  typeDefs: [
    financeTypeDefs,
    financeBillingTypeDefs,
    financeCompanyTypeDefs,
    financeBudgetTypeDefs,
    financeRecurringTypeDefs,
    financeChangeLogTypeDefs,
    expensesTypeDefs,
  ],
};

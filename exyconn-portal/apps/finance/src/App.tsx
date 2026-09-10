import { Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { FinanceOverviewPage, FinancePage, RecurringInvoicesPage } from './pages/finance';
import { ExpensesPage } from './pages/expenses';
import { PaymentsPage } from './pages/payments';
import { ReceivablesPage } from './pages/receivables';
import { CompanyExpensesPage } from './pages/company-expenses';
import { CostCentersPage } from './pages/cost-centers';
import { BudgetsPage } from './pages/budgets';
import { BudgetVariancePage } from './pages/budget-variance';

/** Finance micro-frontend. Everything outside its routes comes from the shell. */
export function App() {
  return (
    <PortalApp loginElement={<Login />} moduleRole={ROLES.FINANCE} homePath="/finance">
      <Route path="/finance" element={<FinanceOverviewPage />} />
      <Route path="/finance/invoices" element={<FinancePage />} />
      <Route path="/finance/recurring" element={<RecurringInvoicesPage />} />
      <Route path="/finance/payments" element={<PaymentsPage />} />
      <Route path="/finance/receivables" element={<ReceivablesPage />} />
      <Route path="/finance/company-expenses" element={<CompanyExpensesPage />} />
      <Route path="/finance/cost-centres" element={<CostCentersPage />} />
      <Route path="/finance/budgets" element={<BudgetsPage />} />
      <Route path="/finance/budget-variance" element={<BudgetVariancePage />} />
      <Route path="/expenses" element={<ExpensesPage />} />
    </PortalApp>
  );
}

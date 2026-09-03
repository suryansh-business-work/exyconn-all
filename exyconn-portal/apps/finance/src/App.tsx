import { Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { FinanceOverviewPage, FinancePage } from './pages/finance';
import { ExpensesPage } from './pages/expenses';

/** Finance micro-frontend. Everything outside its routes comes from the shell. */
export function App() {
  return (
    <PortalApp loginElement={<Login />} moduleRole={ROLES.FINANCE} homePath="/finance">
      <Route path="/finance" element={<FinanceOverviewPage />} />
      <Route path="/finance/invoices" element={<FinancePage />} />
      <Route path="/expenses" element={<ExpensesPage />} />
    </PortalApp>
  );
}

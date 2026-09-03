import { Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { CrmOverviewPage, CrmPage } from './pages/crm';
import { CompaniesPage } from './pages/companies';
import { ContactsPage } from './pages/contacts';
import { DealsPage } from './pages/deals';
import { ActivitiesPage } from './pages/activities';

/** CRM micro-frontend. Everything outside its routes comes from the shell. */
export function App() {
  return (
    <PortalApp loginElement={<Login />} moduleRole={ROLES.CRM} homePath="/crm">
      <Route path="/crm" element={<CrmOverviewPage />} />
      <Route path="/crm/leads" element={<CrmPage />} />
      <Route path="/crm/companies" element={<CompaniesPage />} />
      <Route path="/crm/contacts" element={<ContactsPage />} />
      <Route path="/crm/deals" element={<DealsPage />} />
      <Route path="/crm/activities" element={<ActivitiesPage />} />
    </PortalApp>
  );
}

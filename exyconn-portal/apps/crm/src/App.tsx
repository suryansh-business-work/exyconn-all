import { Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { CrmOverviewPage, CrmPage } from './pages/crm';
import { CompaniesPage } from './pages/companies';
import { CompanyDetailPage } from './pages/companies/detail';
import { ContactsPage } from './pages/contacts';
import { ContactDetailPage } from './pages/contacts/detail';
import { DealsListPage, DealsPage } from './pages/deals';
import { ActivitiesPage } from './pages/activities';
import { EmailVerifierPage } from './pages/email-verifier';
import { PropertiesPage } from './pages/settings';

/** CRM micro-frontend. Everything outside its routes comes from the shell. */
export function App() {
  return (
    <PortalApp loginElement={<Login />} moduleRole={ROLES.CRM} homePath="/crm">
      <Route path="/crm" element={<CrmOverviewPage />} />
      <Route path="/crm/leads" element={<CrmPage />} />
      <Route path="/crm/companies" element={<CompaniesPage />} />
      <Route path="/crm/companies/:id/:tab?" element={<CompanyDetailPage />} />
      <Route path="/crm/contacts" element={<ContactsPage />} />
      <Route path="/crm/contacts/:id/:tab?" element={<ContactDetailPage />} />
      <Route path="/crm/deals" element={<DealsPage />} />
      <Route path="/crm/deals/list" element={<DealsListPage />} />
      <Route path="/crm/activities" element={<ActivitiesPage />} />
      <Route path="/crm/tools/email-verifier/:tab?" element={<EmailVerifierPage />} />
      <Route path="/crm/settings/properties/:object?" element={<PropertiesPage />} />
    </PortalApp>
  );
}

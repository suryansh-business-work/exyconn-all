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
import { LeadGeneratorPage } from './pages/lead-generator';
import { WebsiteScraperPage } from './pages/website-scraper';
import { PropertiesPage } from './pages/settings';
import { GmailAccountsPage } from './pages/settings/gmail';
import { IntegrationsPage } from './pages/integrations';
import { CommsDockLayout } from './records/comms';
import { MeetingsPage } from './pages/meetings';
import { BookingProfilePage, BookMeetingPage } from './pages/book';

/** The booking pages anyone can open from a meeting link, with no sign-in (like Calendly). */
const PUBLIC_ROUTES = (
  <>
    <Route path="/book/:org" element={<BookingProfilePage />} />
    <Route path="/book/:org/:slug" element={<BookMeetingPage />} />
  </>
);

/** CRM micro-frontend. Everything outside its routes comes from the shell. */
export function App() {
  return (
    <PortalApp
      loginElement={<Login />}
      moduleRole={ROLES.CRM}
      homePath="/crm"
      publicRoutes={PUBLIC_ROUTES}
    >
      {/* The communication dock floats over every CRM page, so a call or a text keeps going. */}
      <Route element={<CommsDockLayout />}>
        <Route path="/crm" element={<CrmOverviewPage />} />
        <Route path="/crm/leads" element={<CrmPage />} />
        <Route path="/crm/companies" element={<CompaniesPage />} />
        <Route path="/crm/companies/:id/:tab?" element={<CompanyDetailPage />} />
        <Route path="/crm/contacts" element={<ContactsPage />} />
        <Route path="/crm/contacts/:id/:tab?" element={<ContactDetailPage />} />
        <Route path="/crm/deals" element={<DealsPage />} />
        <Route path="/crm/deals/list" element={<DealsListPage />} />
        <Route path="/crm/activities" element={<ActivitiesPage />} />
        <Route path="/crm/meetings/:tab?" element={<MeetingsPage />} />
        <Route path="/crm/tools/email-verifier/:tab?" element={<EmailVerifierPage />} />
        <Route path="/crm/tools/lead-generator" element={<LeadGeneratorPage />} />
        <Route path="/crm/tools/website-scraper" element={<WebsiteScraperPage />} />
        <Route path="/crm/settings/properties/:object?" element={<PropertiesPage />} />
        <Route path="/crm/settings/gmail" element={<GmailAccountsPage />} />
        <Route path="/crm/integrations/:tab?" element={<IntegrationsPage />} />
      </Route>
    </PortalApp>
  );
}

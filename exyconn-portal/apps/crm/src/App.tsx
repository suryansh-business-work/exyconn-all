import { Navigate, Route } from 'react-router-dom';
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
import { IntegrationsPage } from './pages/integrations';
import { EMAIL_INTEGRATIONS_PATH } from './integrations/emailIntegrationsPath';
import { CommsDockLayout } from './records/comms';
import { MeetingsPage } from './pages/meetings';
import { CalendarPage } from './pages/calendar';
import { MailPage } from './pages/mail';
import { BookingProfilePage, BookMeetingPage } from './pages/book';
import { LegacyCrmRedirect } from './LegacyCrmRedirect';

/**
 * The booking pages anyone can open from a meeting link, with no sign-in (like Calendly). The
 * company is the address prefix (/organization/:org), so the path names only the page.
 */
const PUBLIC_ROUTES = (
  <>
    <Route path="/book/:page" element={<BookingProfilePage />} />
    <Route path="/book/:page/:slug" element={<BookMeetingPage />} />
  </>
);

/** CRM micro-frontend. Everything outside its routes comes from the shell. */
export function App() {
  return (
    <PortalApp
      loginElement={<Login />}
      moduleRole={ROLES.CRM}
      homePath="/"
      publicRoutes={PUBLIC_ROUTES}
    >
      {/* The communication dock floats over every CRM page, so a call or a text keeps going. */}
      <Route element={<CommsDockLayout />}>
        <Route path="/" element={<CrmOverviewPage />} />
        <Route path="/mail/:folder?" element={<MailPage />} />
        <Route path="/leads" element={<CrmPage />} />
        <Route path="/companies" element={<CompaniesPage />} />
        <Route path="/companies/:id/:tab?" element={<CompanyDetailPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/contacts/:id/:tab?" element={<ContactDetailPage />} />
        <Route path="/deals" element={<DealsPage />} />
        <Route path="/deals/list" element={<DealsListPage />} />
        <Route path="/activities" element={<ActivitiesPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/meetings/:tab?" element={<MeetingsPage />} />
        {/* Cold emails live on each contact's and company's own tab now; old links land on Contacts. */}
        <Route path="/cold-emails/*" element={<Navigate to="/contacts" replace />} />
        <Route path="/tools/email-verifier/:tab?" element={<EmailVerifierPage />} />
        <Route path="/tools/lead-generator" element={<LeadGeneratorPage />} />
        <Route path="/tools/website-scraper" element={<WebsiteScraperPage />} />
        <Route path="/settings/properties/:object?" element={<PropertiesPage />} />
        {/* Mailboxes are connected in Integrations now; the old Connect Gmail page lands there. */}
        <Route path="/settings/gmail" element={<Navigate to={EMAIL_INTEGRATIONS_PATH} replace />} />
        <Route path="/integrations/:tab?" element={<IntegrationsPage />} />
      </Route>
      <Route path="/crm/*" element={<LegacyCrmRedirect />} />
    </PortalApp>
  );
}

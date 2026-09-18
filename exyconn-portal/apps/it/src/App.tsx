import { Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { AccessManagementPage, PasswordResetsPage } from './pages/access';
import { AnnouncementsPage } from './pages/announcements';
import { AssetDetailPage, AssetsPage } from './pages/assets';
import { ChangesPage } from './pages/changes';
import { CloudPage } from './pages/cloud';
import { DashboardPage } from './pages/dashboard';
import { HelpdeskPage, HelpdeskTicketPage } from './pages/helpdesk';
import { IncidentsPage } from './pages/incidents';
import { CostPage, ReportsPage } from './pages/insights';
import { KnowledgeBasePage } from './pages/knowledge-base';
import { LicencesPage } from './pages/licences';
import { OffboardingPage, OnboardingPage } from './pages/lifecycle';
import { NetworkPage } from './pages/network';
import { PeoplePage } from './pages/people';
import { PoliciesPage } from './pages/policies';
import { ProcurementPage } from './pages/procurement';
import { SecurityPage } from './pages/security';
import { SettingsPage } from './pages/settings';

/** IT micro-frontend. Everything outside its routes comes from the shell. */
export function App() {
  return (
    <PortalApp loginElement={<Login />} moduleRole={ROLES.IT} homePath="/it">
      <Route path="/it" element={<DashboardPage />} />
      <Route path="/it/reports" element={<ReportsPage />} />
      <Route path="/it/helpdesk" element={<HelpdeskPage />} />
      <Route path="/it/helpdesk/:id" element={<HelpdeskTicketPage />} />
      <Route path="/it/knowledge-base" element={<KnowledgeBasePage />} />
      <Route path="/it/announcements" element={<AnnouncementsPage />} />
      <Route path="/it/people/:id?" element={<PeoplePage />} />
      <Route path="/it/access" element={<AccessManagementPage />} />
      <Route path="/it/passwords" element={<PasswordResetsPage />} />
      <Route path="/it/onboarding" element={<OnboardingPage />} />
      <Route path="/it/offboarding" element={<OffboardingPage />} />
      <Route path="/it/assets" element={<AssetsPage />} />
      <Route path="/it/assets/:id" element={<AssetDetailPage />} />
      <Route path="/it/licences" element={<LicencesPage />} />
      <Route path="/it/cloud" element={<CloudPage />} />
      <Route path="/it/network" element={<NetworkPage />} />
      <Route path="/it/incidents" element={<IncidentsPage />} />
      <Route path="/it/changes" element={<ChangesPage />} />
      <Route path="/it/security" element={<SecurityPage />} />
      <Route path="/it/procurement" element={<ProcurementPage />} />
      <Route path="/it/cost" element={<CostPage />} />
      <Route path="/it/policies" element={<PoliciesPage />} />
      <Route path="/it/settings" element={<SettingsPage />} />
    </PortalApp>
  );
}

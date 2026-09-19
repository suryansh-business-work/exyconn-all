import { Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { MarketingOverviewPage, MarketingPage } from './pages/marketing';
import { AudiencesPage } from './pages/audiences';
import { SuppressionPage } from './pages/suppression';
import { SocialPage } from './pages/social';

/** Marketing micro-frontend. Everything outside its routes comes from the shell. */
export function App() {
  return (
    <PortalApp loginElement={<Login />} moduleRole={ROLES.MARKETING} homePath="/marketing">
      <Route path="/marketing" element={<MarketingOverviewPage />} />
      <Route path="/marketing/campaigns" element={<MarketingPage />} />
      <Route path="/marketing/audiences" element={<AudiencesPage />} />
      <Route path="/marketing/suppression" element={<SuppressionPage />} />
      <Route path="/marketing/social/:tab?" element={<SocialPage />} />
    </PortalApp>
  );
}

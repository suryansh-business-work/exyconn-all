import { Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { AssetsPage } from './pages/assets';
import { LicencesPage } from './pages/licences';
import { ItOverviewPage } from './pages/overview';

/** IT micro-frontend. Everything outside its routes comes from the shell. */
export function App() {
  return (
    <PortalApp loginElement={<Login />} moduleRole={ROLES.IT} homePath="/it">
      <Route path="/it" element={<ItOverviewPage />} />
      <Route path="/it/assets" element={<AssetsPage />} />
      <Route path="/it/licences" element={<LicencesPage />} />
    </PortalApp>
  );
}

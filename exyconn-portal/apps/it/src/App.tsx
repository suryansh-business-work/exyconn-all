import { Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { AssetsPage } from './pages/assets';

/** IT micro-frontend. Everything outside its routes comes from the shell. */
export function App() {
  return (
    <PortalApp loginElement={<Login />} moduleRole={ROLES.IT} homePath="/it/assets">
      <Route path="/it/assets" element={<AssetsPage />} />
    </PortalApp>
  );
}
